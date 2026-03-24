

export default function UsuariosModal({ mode, form, setForm, onClose, onSubmit }) {
  return (
    <div
      className="usuarios-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      <div
        className="usuarios-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>{mode === 'create' ? 'Crear usuario' : 'Editar usuario'}</h2>
        <form onSubmit={onSubmit}>
          <label htmlFor="usuarios-name">Nombre</label>
          <input
            id="usuarios-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            placeholder="Nombre completo"
          />
          <label htmlFor="usuarios-email">Email</label>
          <input
            id="usuarios-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            disabled={mode === 'edit'}
            placeholder="correo@ejemplo.com"
          />
          <label htmlFor="usuarios-phone">Teléfono</label>
          <input
            id="usuarios-phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Opcional"
          />
          <label htmlFor="usuarios-password">Contraseña {mode === 'edit' && '(dejar vacío para no cambiar)'}</label>
          <input
            id="usuarios-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required={mode === 'create'}
            placeholder={mode === 'edit' ? '••••••••' : 'Mínimo 6 caracteres'}
          />
          {mode === 'create' && (
            <>
              <label htmlFor="usuarios-role">Rol</label>
              <select
                id="usuarios-role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="SALES">Comercial</option>
                <option value="QUOTER">Cotizador</option>
                <option value="DESIGNER">Diseñador</option>
                <option value="DEVELOPMENT">Desarrollo</option>
                <option value="ADMIN">Admin</option>
              </select>
              <label htmlFor="usuarios-jobTitle">Cargo</label>
              <input
                id="usuarios-jobTitle"
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder="Cargo / jobTitle"
              />
              <label className="usuarios-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isLeader ?? false}
                  onChange={(e) => setForm((p) => ({ ...p, isLeader: e.target.checked }))}
                />
                Líder / Jefe (puede asignar productos a otros)
              </label>
            </>
          )}
          {mode === 'edit' && (
            <>
              <label htmlFor="usuarios-jobTitle-edit">Cargo</label>
              <input
                id="usuarios-jobTitle-edit"
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder="Cargo / jobTitle"
              />
              <label className="usuarios-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isLeader ?? false}
                  onChange={(e) => setForm((p) => ({ ...p, isLeader: e.target.checked }))}
                />
                Líder / Jefe (puede asignar productos a otros)
              </label>
            </>
          )}
          <div className="usuarios-modal-actions">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
