import { useState } from 'react';
import ColombiaRegionesMap from './ColombiaRegionesMap';
import AutocompleteInput from './AutocompleteInput';
import './ProjectForm.css';

export default function ProjectForm({
  onSubmit,
  submitting = false,
  submitMessage = '',
  cartEmpty = false,
  asesor = '',
  clientOptions = [],
}) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, client, region });
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3>Datos del proyecto</h3>
      <label>
        Nombre del proyecto
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del proyecto"
          required
        />
      </label>
      <label>
        Cliente
        <AutocompleteInput
          value={client}
          onChange={(e) => setClient(e.target.value)}
          options={clientOptions}
          placeholder="Cliente"
          name="client"
        />
      </label>
      <label>
        Asesor
        <input
          type="text"
          value={asesor}
          readOnly
          disabled
          className="project-form-readonly"
        />
      </label>
      <label>
        Región <span className="project-form-required">*</span>
        <div className="project-form-map">
          <ColombiaRegionesMap
            value={region}
            onChange={setRegion}
            singleSelect
          />
        </div>
        {!region && (
          <span className="project-form-hint">Seleccione una región en el mapa</span>
        )}
      </label>

      {submitMessage && (
        <p className="project-form-message">{submitMessage}</p>
      )}

      <button
        type="submit"
        className="project-form-btn"
        disabled={submitting || cartEmpty || !region}
      >
        {submitting ? 'Enviando...' : 'Crear Proyecto'}
      </button>
    </form>
  );
}
