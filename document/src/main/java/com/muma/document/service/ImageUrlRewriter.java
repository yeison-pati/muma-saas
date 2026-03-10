package com.muma.document.service;

import org.springframework.stereotype.Service;

import com.muma.document.config.app.AppProperties;

import lombok.RequiredArgsConstructor;

/**
 * Reescribe URLs de imágenes en HTML para que el MS document pueda cargarlas
 * desde MinIO dentro de su contenedor. El front envía URLs con la base pública
 * (ej. http://localhost:8000/images); aquí las reemplazamos por la base interna
 * (ej. http://minio:9000) para que las peticiones no apunten al localhost del contenedor.
 */
@Service
@RequiredArgsConstructor
public class ImageUrlRewriter {

    private final AppProperties appProperties;

    /**
     * Reemplaza en {@code html} toda URL de imagen que coincida con la base pública
     * por la base interna, de forma que openhtmltopdf pueda cargar las imágenes
     * desde MinIO dentro del contenedor.
     */
    public String rewriteImageUrlsInHtml(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        var images = appProperties.images();
        if (images == null || images.publicBaseUrl() == null || images.internalBaseUrl() == null) {
            return html;
        }
        String publicBase = normalizeBase(images.publicBaseUrl());
        String internalBase = normalizeBase(images.internalBaseUrl());
        if (publicBase.isEmpty() || internalBase.isEmpty()) {
            return html;
        }
        // Reemplazar en atributos src (img, source, etc.)
        String out = html;
        out = replaceAttribute(out, "src=", publicBase, internalBase);
        out = replaceAttribute(out, "href=", publicBase, internalBase);
        return out;
    }

    private static String normalizeBase(String base) {
        if (base == null) return "";
        return base.trim().replaceAll("/+$", "");
    }

    private static String replaceAttribute(String html, String attr, String from, String to) {
        // Caso: src="http://localhost:8000/images/bucket/key"
        int idx = 0;
        StringBuilder sb = new StringBuilder();
        String search = attr;
        while (true) {
            int i = html.indexOf(search, idx);
            if (i < 0) break;
            sb.append(html, idx, i + search.length());
            int start = i + search.length();
            char quote = 0;
            if (start < html.length()) {
                char q = html.charAt(start);
                if (q == '"' || q == '\'') {
                    quote = q;
                    start++;
                }
            }
            if (quote != 0) {
                int end = html.indexOf(quote, start);
                if (end > start) {
                    String value = html.substring(start, end);
                    if (value.startsWith(from)) {
                        value = to + value.substring(from.length());
                    }
                    sb.append(quote).append(value).append(quote);
                    idx = end + 1;
                    continue;
                }
            }
            idx = i + 1;
        }
        sb.append(html.substring(idx));
        return sb.toString();
    }
}
