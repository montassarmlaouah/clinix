package com.pfe.pfe.repository;

import com.pfe.pfe.model.StockMedicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockMedicamentRepository extends JpaRepository<StockMedicament, String> {
    List<StockMedicament> findByCliniqueId(String cliniqueId);
    List<StockMedicament> findByQuantiteLessThanEqual(Integer seuil);
}
