package com.muma.document.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.codec.multipart.FilePart;

import com.muma.document.dto.FileUploadResponse;
import com.muma.document.service.S3Service;

import lombok.AllArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/mediaFile")
@AllArgsConstructor
public class S3Controller {

    private final S3Service s3Service;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<FileUploadResponse> upload(
            @RequestPart("file") FilePart file,
            @RequestParam("type") String type) {

        return s3Service.upload(file, type)
                .map(FileUploadResponse::new);
    }

    @DeleteMapping
    public Mono<Void> delete(
            @RequestParam String type,
            @RequestParam String key) {

        return s3Service.delete(type, key);
    }

    @PostMapping("/url")
    public Mono<Map<String, String>> getUrlsBatch(@RequestBody List<String> keys, @RequestParam String type) {

        return Mono.just(s3Service.generateUrls(keys, type));
    }

    @PutMapping(value = "/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<FileUploadResponse> replace(
            @RequestParam String oldKey,
            @RequestParam String type,
            @RequestPart("file") FilePart file) {

        return s3Service.upload(file, type)
                .flatMap(newKey -> s3Service.delete(type, oldKey)
                        .thenReturn(new FileUploadResponse(newKey)));
    }
}
