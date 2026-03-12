package com.muma.catalog.config;

import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.muma.catalog.models.TypologyStandard;
import com.muma.catalog.repositories.TypologyStandardRepo;

/**
 * Carga estándares por defecto según tabla de referencia:
 * P1: 1, 0, 2 | P2: 2, 2, 2 | P3: 5, 3, 3 | P4: 2, 1, 1 | P5: 10, 0, 1 | P: 5, 0, 6h/sem
 */
@Configuration
public class TypologyStandardDataLoader {

    @Bean
    CommandLineRunner loadTypologyStandards(TypologyStandardRepo repo) {
        return args -> {
            if (repo.count() > 0) return;
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p1").daysCotiz(1).daysDiseno(0).daysDesarrollo(2).build());
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p2").daysCotiz(2).daysDiseno(2).daysDesarrollo(2).build());
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p3").daysCotiz(5).daysDiseno(3).daysDesarrollo(3).build());
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p4").daysCotiz(2).daysDiseno(1).daysDesarrollo(1).build());
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p5").daysCotiz(10).daysDiseno(0).daysDesarrollo(1).build());
            repo.save(TypologyStandard.builder().id(UUID.randomUUID()).tipologia("p").daysCotiz(5).daysDiseno(0).daysDesarrollo(null).hoursPerWeek(6).build());
        };
    }
}
