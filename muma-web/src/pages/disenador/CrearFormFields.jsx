import AutocompleteInput from '../../components/AutocompleteInput';

export default function CrearFormFields({
  form,
  handleChange,
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
        <input
          id="crear-code"
          name="code"
          value={form.code}
          onChange={handleChange}
          required
          autoComplete="off"
        />
      </label>
      <label htmlFor="crear-name">
        Nombre *
        <input
          id="crear-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoComplete="off"
        />
      </label>
      <label htmlFor="crear-category">
        Categoría *
        <AutocompleteInput
          id="crear-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          options={categories}
          required
        />
      </label>
      <label htmlFor="crear-subcategory">
        Subcategoría *
        <AutocompleteInput
          id="crear-subcategory"
          name="subcategory"
          value={form.subcategory}
          onChange={handleChange}
          options={subcategories}
          required
        />
      </label>
      <label htmlFor="crear-space">
        Espacio *
        <AutocompleteInput
          id="crear-space"
          name="space"
          value={form.space}
          onChange={handleChange}
          options={spaces}
          required
        />
      </label>
      <label htmlFor="crear-line">
        Línea *
        <AutocompleteInput
          id="crear-line"
          name="line"
          value={form.line}
          onChange={handleChange}
          options={lines}
          required
        />
      </label>
      <label htmlFor="crear-baseMaterial">
        Materia base *
        <AutocompleteInput
          id="crear-baseMaterial"
          name="baseMaterial"
          value={form.baseMaterial}
          onChange={handleChange}
          options={baseMaterials}
          required
        />
      </label>
    </div>
  );
}
