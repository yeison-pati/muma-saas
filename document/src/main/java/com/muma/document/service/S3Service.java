package com.muma.document.service;

import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import com.muma.document.config.app.AppProperties;
import lombok.AllArgsConstructor;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@Service
@AllArgsConstructor
public class S3Service {
    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final AppProperties appProperties;

    public Mono<String> upload(FilePart file, String type) {
        String bucket = resolveBucket(type);
        String extension = Optional.of(file.filename()).filter(f -> f.contains("."))
                .map(f -> f.substring(f.lastIndexOf("."))).orElse("");
        String key = UUID.randomUUID() + extension;
        return DataBufferUtils.join(file.content()).publishOn(Schedulers.boundedElastic()).map(dataBuffer -> {
            try (InputStream is = dataBuffer.asInputStream()) {
                s3Client.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
                        .contentType(Optional.ofNullable(file.headers().getContentType())
                                .map(Object::toString)
                                .orElse("application/octet-stream"))
                        .build(),
                        RequestBody.fromInputStream(is, dataBuffer.readableByteCount()));
                return key;
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                DataBufferUtils.release(dataBuffer);
            }
        });
    }

    public Map<String, String> generateUrls(List<String> keys, String type) {
        String bucket = resolveBucket(type);
        java.util.HashMap<String, String> urlMap = new java.util.HashMap<>();
        
        for (String key : keys) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucket).key(key).build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60)).getObjectRequest(getObjectRequest).build();
            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            urlMap.put(key, presignedRequest.url().toString());
        }
        return urlMap;
    }

    public Mono<Void> delete(String type, String key) {
        String bucket = resolveBucket(type);
        return Mono.fromRunnable(() -> s3Client.deleteObject(b -> b.bucket(bucket).key(key)))
                .subscribeOn(Schedulers.boundedElastic()).then();
    }

    private String resolveBucket(String type) {
        return switch (type.toLowerCase()) {
            case "image" -> appProperties.s3().buckets().images();
            case "model" -> appProperties.s3().buckets().models();
            default -> throw new IllegalArgumentException("Tipo inválido");
        };
    }
}