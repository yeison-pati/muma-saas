import { ENDPOINTS } from './config';

const getStoredToken = () => localStorage.getItem('token');

export async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append('file', file instanceof File ? file : file.file || file);

  const res = await fetch(`${ENDPOINTS.document}/mediaFile/upload?type=${type}`, {
    method: 'POST',
    headers: {
      ...(getStoredToken() && { Authorization: `Bearer ${getStoredToken()}` }),
    },
    body: formData,
  });
  if (!res.ok) throw new Error('Error subiendo archivo');
  const json = await res.json();
  return { key: json.key };
}

export async function getMediaUrls(keys, type = 'image') {
  if (!keys?.length) return { data: {} };
  const res = await fetch(`${ENDPOINTS.document}/mediaFile/url?type=${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getStoredToken() && { Authorization: `Bearer ${getStoredToken()}` }),
    },
    body: JSON.stringify(keys),
  });
  if (!res.ok) throw new Error('Error obteniendo URLs');
  const json = await res.json();
  return { data: json };
}

/**
 * Genera PDF a partir de datos de cotización.
 * Construye HTML profesional y lo envía al document service.
 */
export async function generateProjectPdf(pdfData) {
  const html = buildPdfHtml(pdfData);
  const res = await fetch(`${ENDPOINTS.document}/mediaFile/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...(getStoredToken() && { Authorization: `Bearer ${getStoredToken()}` }),
    },
    body: html,
  });
  if (!res.ok) throw new Error('Error generando PDF');
  return res.blob();
}

function escapeHtml(s) {
  if (s == null || s === 'null') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPdfHtml(data) {
  const {
    projectName = '',
    cliente = '',
    tel = '',
    ciudad = '',
    apreciado = 'Apreciado señor/a',
    regional = '',
    fechaEntrega = '',
    comercialNombre = '',
    comercialTel = '',
    comercialEmail = '',
    comercialCargo = 'ASESOR COMERCIAL',
    productos = [],
    totales = { subtotal: 0, iva: 0, total: 0 },
    validez = 'Validez de la Oferta: 30 días calendario.',
    formaPago = 'Forma de pago: 50% ANTICIPO Y 50% A CONVENIR.',
    caracteristicasOferta = '',
    plazoEntrega = '25-30 días hábiles.',
    transporte = 'Incluido a ciudades principales.',
    instalacion = 'Incluido a ciudades principales.',
    condicionesEntrega = '',
    garantia = '3 años en estructura por defectos de fabricación.',
  } = data;

  const subtotal = totales?.subtotal ?? 0;
  const iva = totales?.iva ?? 0;
  const total = totales?.total ?? 0;

  const escapeUrl = (url) => (url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  const productRows = (productos || []).map((p) => {
    const precio = parseFloat(p.precioUnitario) || 0;
    const desc = parseFloat(p.descuento) || 0;
    const cant = parseInt(p.cantidad, 10) || 1;
    const precioConDesc = precio - (precio * desc) / 100;
    const subtotalProducto = precioConDesc * cant;
    const descuentoStr = desc > 0 ? `${desc}%` : '0%';
    const descripcion = escapeHtml(String(p.descripcion || '')).replace(/\n/g, '<br/>');
    const imagenUrl = p.imagenUrl;
    const imgHtml = imagenUrl
      ? `<img src="${escapeUrl(imagenUrl)}" class="thumb" alt=""/>`
      : '<div class="thumb" style="display:inline-block;line-height:70px;text-align:center;color:#94a3b8;">IMG</div>';
    return `
    <div class="product-row">
      ${imgHtml}
      <div class="p-body">
        <div class="desc">${descripcion}</div>
        <div class="meta-grid">
          <div class="meta-item"><span class="k">Valor unitario</span><span class="v">$ ${precio.toFixed(2)}</span></div>
          <div class="meta-item"><span class="k">Descuento</span><span class="v">${descuentoStr}</span></div>
          <div class="meta-item"><span class="k">Valor neto</span><span class="v">$ ${precioConDesc.toFixed(2)}</span></div>
          <div class="meta-item"><span class="k">Cantidad</span><span class="v">${cant}</span></div>
          <div class="meta-item"><span class="k">Subtotal</span><span class="v">$ ${subtotalProducto.toFixed(2)}</span></div>
          <div class="meta-item"><span class="k">VR Total</span><span class="v">$ ${subtotalProducto.toFixed(2)}</span></div>
        </div>
      </div>
      <div style="clear:both"></div>
    </div>`;
  }).join('');

  const productosHtml = productRows || '<div class="product-row" style="padding:20px;color:#999;text-align:center;">No hay productos</div>';

  const conditionsHtml = [];
  if (validez && validez !== 'null') conditionsHtml.push(`<div class="section"><strong>• Validez de la Oferta:</strong> ${escapeHtml(validez)}</div>`);
  if (formaPago && formaPago !== 'null') conditionsHtml.push(`<div class="section"><strong>• Forma de Pago:</strong> ${escapeHtml(formaPago)}</div>`);
  if (caracteristicasOferta && caracteristicasOferta !== 'null') conditionsHtml.push(`<div class="section"><strong>• Características de la Oferta:</strong><br/>${escapeHtml(caracteristicasOferta).replace(/\n/g, '<br/>')}</div>`);
  if (plazoEntrega && plazoEntrega !== 'null') conditionsHtml.push(`<div class="section"><strong>• Plazo de Entrega:</strong> ${escapeHtml(plazoEntrega)}</div>`);
  if (transporte && transporte !== 'null') conditionsHtml.push(`<div class="section"><strong>• Transporte:</strong> ${escapeHtml(transporte)}</div>`);
  if (instalacion && instalacion !== 'null') conditionsHtml.push(`<div class="section"><strong>• Instalación:</strong> ${escapeHtml(instalacion)}</div>`);
  if (condicionesEntrega && condicionesEntrega !== 'null') conditionsHtml.push(`<div class="section"><strong>• Condiciones de Entrega:</strong><br/>${escapeHtml(condicionesEntrega).replace(/\n/g, '<br/>')}</div>`);
  if (garantia && garantia !== 'null') conditionsHtml.push(`<div class="section"><strong>• Garantía:</strong><br/>${escapeHtml(garantia).replace(/\n/g, '<br/>')}</div>`);

  const signatureHtml = (comercialNombre && comercialNombre !== 'null')
    ? `<div class="signature">
        <div class="name">${escapeHtml(comercialNombre)}</div>
        ${comercialCargo && comercialCargo !== 'null' ? `<div class="role">${escapeHtml(comercialCargo)}</div>` : ''}
        ${comercialTel && comercialTel !== 'null' ? `<div class="role">${escapeHtml(comercialTel)}</div>` : ''}
        ${comercialEmail && comercialEmail !== 'null' ? `<div class="role">${escapeHtml(comercialEmail)}</div>` : ''}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    @page{size:letter;margin:15mm;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Arial',sans-serif;font-size:11px;color:#17212a;line-height:1.5;}
    .muted{color:#6b7280;}
    .header-card{width:100%;border:1px solid #e5eef2;border-left:4px solid #17a2b8;background:#f7fbfc;border-radius:6px;padding:12px 14px;margin-bottom:12px;}
    .header-line{padding:5px 0;border-bottom:1px dashed #e5eef2;}
    .header-line:last-child{border-bottom:none;}
    .label{display:inline-block;width:30%;font-weight:600;color:#0f172a;font-size:11px;}
    .value{display:inline-block;width:68%;color:#17212a;font-size:11px;}
    .intro{margin:12px 0 14px 0;color:#1f2937;font-size:11px;}
    .product-list{width:100%;border:1px solid #eef2f6;border-radius:6px;overflow:hidden;background:#fff;}
    .product-row{padding:12px;border-bottom:1px solid #eef2f6;page-break-inside:avoid;min-height:90px;}
    .product-row:last-child{border-bottom:none;}
    .thumb{float:left;width:80px;height:80px;border-radius:6px;background:#f1f5f9;object-fit:cover;}
    .p-body{margin-left:94px;}
    .desc{font-size:10px;color:#0f172a;margin:2px 0 8px 0;white-space:pre-wrap;font-weight:600;}
    .meta-grid{margin-top:4px;}
    .meta-item{display:inline-block;width:32%;margin:3px 0;vertical-align:top;}
    .meta-item .k{display:block;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.3px;}
    .meta-item .v{display:block;font-size:11px;font-weight:700;color:#0b2530;margin-top:2px;}
    .totals-wrap{margin-top:16px;}
    .totals-card{margin-left:auto;width:360px;border:1px solid #e5eef2;border-radius:6px;background:#f8fafc;}
    .t-row{padding:8px 12px;border-bottom:1px solid #e5eef2;text-align:right;font-size:11px;}
    .t-row:last-child{border-bottom:none;}
    .t-final{background:#e7f6f8;color:#0b2530;border-top:1px solid #17a2b8;font-weight:800;font-size:12px;}
    .commercial{margin-top:20px;border:1px solid #e5eef2;border-radius:6px;padding:12px 14px;background:#fff;}
    .commercial h3{margin:0 0 10px 0;font-size:12px;text-align:center;color:#0b2530;letter-spacing:.3px;}
    .section{margin:8px 0;}
    .section b{font-size:10px;color:#0b2530;}
    .section p{font-size:10px;color:#1f2937;line-height:1.6;white-space:pre-wrap;}
    .signature{margin-top:16px;padding-top:12px;border-top:1px dashed #e5eef2;text-align:center;}
    .signature .name{font-weight:700;font-size:11px;color:#0b2530;}
    .signature .role{font-size:9px;color:#475569;}
  </style>
</head>
<body>
  <div class="header-card">
    <div class="header-line"><span class="label">Apreciado señor/a:</span><span class="value">${escapeHtml(apreciado)}</span></div>
    <div class="header-line"><span class="label">Organización:</span><span class="value">${escapeHtml(cliente)}</span></div>
    <div class="header-line"><span class="label">Tel:</span><span class="value">${escapeHtml(tel)}</span></div>
    <div class="header-line"><span class="label">Ciudad:</span><span class="value">${escapeHtml(ciudad)}</span></div>
    <div class="header-line"><span class="label">Proyecto:</span><span class="value">${escapeHtml(projectName)}</span></div>
    <div class="header-line"><span class="label">Regional:</span><span class="value">${escapeHtml(regional)}</span></div>
    <div class="header-line"><span class="label">Fecha:</span><span class="value">${escapeHtml(fechaEntrega)}</span></div>
  </div>

  <div class="intro">
    De acuerdo a su solicitud, presentamos a su consideración nuestra oferta de los siguientes productos:
  </div>

  <div class="product-list">
    ${productosHtml}
  </div>

  <div class="totals-wrap"><div class="totals-card">
    <div class="t-row"><span class="muted">SUBTOTAL</span> &#160; $ ${Number(subtotal).toFixed(2)}</div>
    <div class="t-row"><span class="muted">IVA (19%)</span> &#160; $ ${Number(iva).toFixed(2)}</div>
    <div class="t-row t-final">TOTAL GENERAL CON IVA &#160; $ ${Number(total).toFixed(2)}</div>
  </div></div>

  <div class="commercial">
    <h3>CONDICIONES COMERCIALES</h3>
    ${conditionsHtml.join('')}
    ${signatureHtml}
  </div>

  <div style="margin-top:20px;padding:10px 12px;border-top:1px solid #ddd;font-size:8px;color:#999;text-align:center;">
    MUMA S.A.S · Documento generado automáticamente
  </div>
</body>
</html>`;
}
