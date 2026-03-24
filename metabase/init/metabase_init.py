#!/usr/bin/env python3
"""
Inicializa Metabase con:
- Setup inicial (si aplica) o login
- Conexión a base de datos Catálogo
- Dashboard OTIF con filtros dinámicos
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE = os.environ.get("METABASE_BASE", "http://metabase:3000")
ADMIN_EMAIL = os.environ.get("METABASE_ADMIN_1_EMAIL", "admin@muma.local")
ADMIN_PASS = os.environ.get("METABASE_ADMIN_1_PASS", "Muma.Admin2024!")
VIEWER_EMAIL = os.environ.get("METABASE_VIEWER_EMAIL", "viewer@muma.local")
VIEWER_PASS = os.environ.get("METABASE_VIEWER_PASS", "Muma.Viewer2024!")
CATALOG_HOST = os.environ.get("CATALOG_DB_HOST", "catalogdb")
CATALOG_PORT = int(os.environ.get("CATALOG_DB_PORT", "5432"))
CATALOG_USER = os.environ.get("CATALOG_DB_USER", "postgres")
CATALOG_PASS = os.environ.get("CATALOG_DB_PASS", "postgres123")
CATALOG_NAME = os.environ.get("CATALOG_DB_NAME", "catalog_db")
QUERIES_DIR = os.environ.get("METABASE_QUERIES_DIR", "/queries")


def req(method, path, data=None, session=None):
    url = f"{BASE}/api{path}"
    headers = {"Content-Type": "application/json"}
    if session:
        headers["X-Metabase-Session"] = session
    req_obj = urllib.request.Request(url, method=method, headers=headers)
    if data is not None:
        req_obj.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req_obj, timeout=30) as r:
            return json.loads(r.read().decode()), r.status
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return json.loads(body), e.code
        except json.JSONDecodeError:
            return {"error": body}, e.code


def wait_ready():
    for i in range(90):
        try:
            r, _ = req("GET", "/health")
            if r.get("status") == "ok":
                return True
        except Exception:
            if i % 10 == 0 and i > 0:
                print(f"  ... esperando ({i*2}s)")
        time.sleep(2)
    return False


def get_setup_token():
    r, _ = req("GET", "/session/properties")
    return r.get("setup-token")


def setup(session_out):
    r, code = req("POST", "/setup", {
        "token": get_setup_token(),
        "user": {
            "first_name": "Admin",
            "last_name": "MUMA",
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS,
        },
        "database": None,
        "prefs": {"site_name": "MUMA Analytics", "allow_tracking": False},
    })
    if code in (200, 204) and "id" in r:
        session_out.append(r["id"])
        return True
    return False


def login(session_out):
    r, code = req("POST", "/session", {"username": ADMIN_EMAIL, "password": ADMIN_PASS})
    if code == 200 and "id" in r:
        session_out.append(r["id"])
        return True
    return False


def get_or_create_db(session):
    r, _ = req("GET", "/database", session=session)
    dbs = r.get("data", []) if isinstance(r, dict) else (r if isinstance(r, list) else [])
    for db in dbs:
        if db.get("name") == "Catálogo":
            return db["id"]
    r, code = req("POST", "/database", {
        "engine": "postgres",
        "name": "Catálogo",
        "details": {
            "host": CATALOG_HOST,
            "port": CATALOG_PORT,
            "dbname": CATALOG_NAME,
            "user": CATALOG_USER,
            "password": CATALOG_PASS,
        },
    }, session=session)
    if code in (200, 201) and "id" in r:
        return r["id"]
    return None


def load_query(name):
    path = f"{QUERIES_DIR}/{name}"
    if os.path.exists(path):
        with open(path) as f:
            return f.read().strip()
    return ""


def build_otif_template_tags():
    tags = {}
    filter_fields = [
        ("semana_ingreso", "Semana (IYYY-IW)"),
        ("mes_ingreso", "Mes (YYYY-MM)"),
        ("tipologia", "Tipología"),
        ("region", "Región"),
        ("quoter_id", "ID Cotizador"),
        ("designer_id", "ID Diseñador"),
        ("development_user_id", "ID Desarrollo"),
    ]
    for slug, display in filter_fields:
        tags[slug] = {
            "id": slug,
            "name": slug,
            "display-name": display,
            "type": "category",
            "required": False,
        }
    return tags


def build_otif_query_with_filters(base_query):
    filters = """
[[ AND semana_ingreso = {{semana_ingreso}} ]]
[[ AND mes_ingreso = {{mes_ingreso}} ]]
[[ AND tipologia = {{tipologia}} ]]
[[ AND region = {{region}} ]]
[[ AND quoter_id = {{quoter_id}}::uuid ]]
[[ AND designer_id = {{designer_id}}::uuid ]]
[[ AND development_user_id = {{development_user_id}}::uuid ]]
"""
    return f"""
WITH otif_base AS (
{base_query}
)
SELECT * FROM otif_base
WHERE 1=1
{filters.strip()}
ORDER BY p_created_at DESC
"""


def create_or_update_card(session, db_id, name, query, display="table", template_tags=None):
    # Buscar si ya existe una card con el mismo nombre
    r_list, _ = req("GET", "/card", session=session)
    card_id = None
    if isinstance(r_list, list):
        for c in r_list:
            if c.get("name") == name:
                card_id = c["id"]
                break

    payload = {
        "name": name,
        "dataset_query": {
            "type": "native",
            "native": {
                "query": query,
                "template-tags": template_tags or {},
            },
            "database": db_id,
        },
        "display": display,
        "visualization_settings": {},
    }

    if card_id:
        print(f"Actualizando card existente '{name}' (id={card_id})")
        r, code = req("PUT", f"/card/{card_id}", payload, session=session)
        if code in (200, 202, 204):
            return card_id
    else:
        print(f"Creando nueva card '{name}'")
        r, code = req("POST", "/card", payload, session=session)
        if code in (200, 202) and "id" in r:
            return r["id"]
    return None


def create_or_update_dashboard(session, name):
    # Buscar dashboard existente
    r_list, _ = req("GET", "/dashboard", session=session)
    dash_id = None
    if isinstance(r_list, list):
        for d in r_list:
            if d.get("name") == name:
                dash_id = d["id"]
                break
    
    if dash_id:
        print(f"Dashboard '{name}' ya existe (id={dash_id})")
        return dash_id

    r, code = req("POST", "/dashboard", {"name": name}, session=session)
    if code in (200, 202) and "id" in r:
        return r["id"]
    return None


def add_card_to_dashboard(session, dash_id, card_id, col=0, row=0, size_x=24, size_y=12):
    r, code = req("POST", f"/dashboard/{dash_id}/cards", {
        "cardId": card_id,
        "col": col,
        "row": row,
        "size_x": size_x,
        "size_y": size_y,
    }, session=session)
    return code in (200, 202)


def create_viewer_user(session):
    r, code = req("POST", "/user", {
        "first_name": "Viewer",
        "last_name": "MUMA",
        "email": VIEWER_EMAIL,
        "password": VIEWER_PASS,
    }, session=session)
    if code not in (200, 202) or "id" not in r:
        return False
    user_id = r["id"]
    _, code2 = req("POST", "/permissions/membership", {
        "user_id": user_id,
        "group_id": 1,
    }, session=session)
    return code2 in (200, 202)


def main():
    print("Esperando Metabase...")
    if not wait_ready():
        print("Metabase no respondió a tiempo")
        sys.exit(1)
    print("Metabase listo")

    session = []
    token = get_setup_token()
    if token:
        print("Intentando setup inicial...")
        if not setup(session):
            print("Setup falló, intentando login directo...")
            if not login(session):
                print("Login falló. Saliendo.")
                sys.exit(1)
        else:
            print("Setup OK")
    else:
        print("Ya configurado (no hay setup-token). Intentando login...")
        if not login(session):
            print("Login falló. Saliendo.")
            sys.exit(1)
        print("Login OK")

    sid = session[0]
    db_id = get_or_create_db(sid)
    if not db_id:
        print("No se pudo obtener/crear DB Catálogo")
        sys.exit(1)
    print(f"DB Catálogo id={db_id}")

    print("Creando usuario viewer...")
    create_viewer_user(sid)

    # ── DASHBOARD OTIF ──
    otif_base_query = load_query("06_otif_cumplimiento.sql")
    if not otif_base_query:
        print("ERROR: Query OTIF no encontrada (06_otif_cumplimiento.sql)")
        sys.exit(1)

    otif_query = build_otif_query_with_filters(otif_base_query)
    otif_tags = build_otif_template_tags()
    otif_card_id = create_or_update_card(
        sid, db_id,
        "OTIF Cumplimiento — Por Semana/Mes/Tipología",
        otif_query, "table", otif_tags
    )
    if not otif_card_id:
        print("Error al crear/actualizar card OTIF")
        sys.exit(1)
    print(f"Card OTIF procesada id={otif_card_id}")

    otif_dash_id = create_or_update_dashboard(sid, "OTIF — Cumplimiento de Proyectos")
    if not otif_dash_id:
        print("Error al crear/obtener dashboard OTIF")
        sys.exit(1)

    # Limpiar dashboard actual antes de agregar (opcional, pero ayuda si ya existe)
    # Por simplicidad solo agregamos la card si no está.
    r_dash, _ = req("GET", f"/dashboard/{otif_dash_id}", session=sid)
    existing_cards = r_dash.get("ordered_cards", [])
    if not any(c.get("card_id") == otif_card_id for c in existing_cards):
        add_card_to_dashboard(sid, otif_dash_id, otif_card_id)
        print("Card agregada al dashboard")
    else:
        print("La card ya está en el dashboard")

    filter_defs = [
        ("Semana", "semana_ingreso"),
        ("Mes", "mes_ingreso"),
        ("Tipología", "tipologia"),
        ("Región", "region"),
        ("Cotizador (ID)", "quoter_id"),
        ("Diseñador (ID)", "designer_id"),
        ("Desarrollo (ID)", "development_user_id"),
    ]
    params = [
        {"id": slug, "type": "string/=", "name": name, "slug": slug}
        for name, slug in filter_defs
    ]
    req("PUT", f"/dashboard/{otif_dash_id}", {"parameters": params}, session=sid)

    mappings = [
        {"parameter_id": slug, "card_id": otif_card_id,
         "target": ["dimension", ["template-tag", slug]]}
        for _, slug in filter_defs
    ]
    req("PUT", f"/dashboard/{otif_dash_id}/cards", {
        "cards": [{
            "id": otif_card_id,
            "col": 0, "row": 0, "size_x": 24, "size_y": 12,
            "parameter_mappings": mappings,
            "visualization_settings": {},
        }]
    }, session=sid)

    print(f"Dashboard OTIF creado id={otif_dash_id} con {len(filter_defs)} filtros")
    print("Listo.")


if __name__ == "__main__":
    main()
