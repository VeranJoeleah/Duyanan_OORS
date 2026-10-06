package com.duyanan.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class ProductCombo {
    private String name;
    private Double price;
}
