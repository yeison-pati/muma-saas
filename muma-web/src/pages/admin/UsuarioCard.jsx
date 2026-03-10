export default function UsuarioCard({ user, canModify, onEdit, onDelete }) {
  return (
    <article className="usuarios-card">
      <div className="usuarios-card-body">
        <h3 className="usuarios-card-name">{user.name}</h3>
        <p className="usuarios-card-email">{user.email}</p>
        {user.phone && (
          <p className="usuarios-card-phone">{user.phone}</p>
        )}
        <span className="usuarios-card-role">{user.role}</span>
      </div>
      <div className="usuarios-card-actions">
        {canModify ? (
          <>
            <button
              type="button"
              className="usuarios-btn usuarios-btn-edit"
              onClick={() => onEdit(user)}
            >
              Editar
            </button>
            <button
              type="button"
              className="usuarios-btn usuarios-btn-delete"
              onClick={() => onDelete(user.id)}
            >
              Eliminar
            </button>
          </>
        ) : (
          <span className="usuarios-card-hint">Creado por otro admin</span>
        )}
      </div>
    </article>
  );
}
