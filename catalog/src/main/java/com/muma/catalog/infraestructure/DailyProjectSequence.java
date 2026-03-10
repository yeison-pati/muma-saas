package com.muma.catalog.infraestructure;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "daily_project_sequences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyProjectSequence {

    @Id
    private LocalDate day;

    @Column(name = "last_value")
    private Integer lastValue;
}
