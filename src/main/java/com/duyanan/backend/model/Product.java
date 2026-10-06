package com.duyanan.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import java.util.List;
import java.util.ArrayList;
import lombok.Data;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Double priceSolo;
    private Double priceALaCarte;
    private Double priceALaCarte2;
    private Double price1Liter;
    private Double price1Point5Liter;
    private Double price2Liter;

    @Column(columnDefinition = "TEXT")
    private String description;
    private String imageUrl;
    private String category;
    private String flavors;

    @ElementCollection
    @CollectionTable(name = "product_combos", joinColumns = @JoinColumn(name = "product_id"))
    private List<ProductCombo> customCombos = new ArrayList<>();
}
