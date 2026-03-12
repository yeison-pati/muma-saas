#!/usr/bin/env python3
"""
Inicializa Metabase con:
- Setup inicial (si aplica) o login
- Conexión a base de datos Catálogo
- 5 preguntas (cards) de analytics
- Dashboard con las 5 vistas
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

# API interna: Metabase sirve en /api (no /analytics/api) desde la red Docker
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
        except Exception as e:
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


def create_card(session, db_id, name, query, display="table"):
    payload = {
        "name": name,
        "dataset_query": {
            "type": "native",
            "native": {"query": query, "template-tags": {}},
            "database": db_id,
        },
        "display": display,
        "visualization_settings": {},
    }
    r, code = req("POST", "/card", payload, session=session)
    if code in (200, 202) and "id" in r:
        return r["id"]
    return None


def create_dashboard(session, name):
    r, code = req("POST", "/dashboard", {"name": name}, session=session)
    if code in (200, 202) and "id" in r:
        return r["id"]
    return None


def add_card_to_dashboard(session, dash_id, card_id, col, row, size_x=6, size_y=4):
    r, code = req("POST", f"/dashboard/{dash_id}/cards", {
        "cardId": card_id,
        "col": col,
        "row": row,
        "size_x": size_x,
        "size_y": size_y,
    }, session=session)
    return code in (200, 202)


def create_viewer_user(session):
    """Crea usuario viewer (solo lectura) y lo añade al grupo All Users (id=1)."""
    r, code = req("POST", "/user", {
        "first_name": "Viewer",
        "last_name": "MUMA",
        "email": VIEWER_EMAIL,
        "password": VIEWER_PASS,
    }, session=session)
    if code not in (200, 202) or "id" not in r:
        # 400 = usuario ya existe u otro error
        return False
    user_id = r["id"]
    # Añadir a All Users (id=1) - permisos de solo lectura por defecto
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
        print("Setup inicial...")
        if not setup(session):
            print("Setup falló")
            sys.exit(1)
        print("Setup OK")
    else:
        print("Login...")
        for attempt in range(5):
            if login(session):
                break
            time.sleep(3)
        if not session:
            print("Login falló (¿Metabase ya configurado con otro admin?)")
            sys.exit(1)
        print("Login OK")

    sid = session[0]
    db_id = get_or_create_db(sid)
    if not db_id:
        print("No se pudo obtener/crear DB Catálogo")
        sys.exit(1)
    print(f"DB Catálogo id={db_id}")

    print("Creando usuario viewer...")
    if create_viewer_user(sid):
        print(f"Usuario viewer creado: {VIEWER_EMAIL}")
    else:
        print("Viewer ya existía o error al crear (se ignora)")

    cards = []
    queries = [
        ("01_productos_especiales_en_proceso.sql", "Productos especiales en proceso", "table"),
        ("02_entregas_por_dia.sql", "Entregas por día", "table"),
        ("03_seguimiento_especiales.sql", "Seguimiento de especiales", "table"),
        ("04_kpis_resumen.sql", "KPIs Resumen", "table"),
        ("05_clasificacion_incumplimiento.sql", "Clasificación incumplimiento", "bar"),
    ]
    for fname, title, display in queries:
        q = load_query(fname)
        if not q:
            print(f"Query no encontrada: {fname}")
            continue
        cid = create_card(sid, db_id, title, q, display)
        if cid:
            cards.append((cid, title))
            print(f"Card creada: {title} (id={cid})")
        else:
            print(f"Error creando card: {title}")

    if not cards:
        print("No se crearon cards")
        sys.exit(1)

    dash_id = create_dashboard(sid, "Analytics MUMA")
    if not dash_id:
        print("Error creando dashboard")
        sys.exit(1)
    print(f"Dashboard creado id={dash_id}")

    for i, (cid, _) in enumerate(cards):
        row = (i // 2) * 5
        col = (i % 2) * 6
        add_card_to_dashboard(sid, dash_id, cid, col, row)
    print("Cards añadidas al dashboard")
    print("Listo.")


if __name__ == "__main__":
    main()
