import AutocompleteInput from '../../components/AutocompleteInput';

export default function CrearFormFields({
  form,
  handleChange,
  setImageFile,
  setModelFile,
  categories,
  subcategories,
  spaces,
  lines,
  baseMaterials,
}) {
  return (
    <div className="crear-form-fields">
      <label htmlFor="crear-code">
        Código *
        <input id="crear-code" name="code" value={form.code} onChange={handleChange} required />
      </label>
      <label htmlFor="crear-name">
        Nombre *
        <input id="crear-name" name="name" value={form.name} onChange={handleChange} required />
      </label>
      <label htmlFor="crear-category">
        Categoría
        <AutocompleteInput
          id="crear-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          options={categories}
          placeholder="Escribir o elegir..."
        />
      </label>
      <label htmlFor="crear-subcategory">
        Subcategoría
        <AutocompleteInput
          id="crear-subcategory"
          name="subcategory"
          value={form.subcategory}
          onChange={handleChange}
          options={subcategories}
          placeholder="Escribir o elegir..."
        />
      </label>
      <label htmlFor="crear-space">
        Espacio
        <AutocompleteInput
          id="crear-space"
          name="space"
          value={form.space}
          onChange={handleChange}
          options={spaces}
          placeholder="Escribir o elegir..."
        />
      </label>
      <label htmlFor="crear-line">
        Línea
        <AutocompleteInput
          id="crear-line"
          name="line"
          value={form.line}
          onChange={handleChange}
          options={lines}
          placeholder="Escribir o elegir..."
        />
      </label>
      <label htmlFor="crear-baseMaterial">
        Materia base
        <AutocompleteInput
          id="crear-baseMaterial"
          name="baseMaterial"
          value={form.baseMaterial}
          onChange={handleChange}
          options={baseMaterials}
          placeholder="Escribir o elegir..."
        />
      </label>
      <label htmlFor="crear-imagen">
        Imagen
        <div className="crear-file-wrap">
          <input
            id="crear-imagen"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>
      </label>
      <label htmlFor="crear-modelo">
        Modelo 3D
        <div className="crear-file-wrap">
          <input
            id="crear-modelo"
            type="file"
            accept=".glb,.gltf"
            onChange={(e) => setModelFile(e.target.files?.[0] || null)}
          />
        </div>
      </label>
    </div>
  );
}
