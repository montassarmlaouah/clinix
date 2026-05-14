package com.pfe.pfe.repository;

import com.pfe.pfe.model.Chambre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChambreRepository extends JpaRepository<Chambre, String> {
    List<Chambre> findByServiceCliniqueId(String cliniqueId);
    List<Chambre> findByServiceId(String serviceId);
    List<Chambre> findByDisponible(Boolean disponible);
    Optional<Chambre> findByNumero(String numero);
    List<Chambre> findByType(Chambre.TypeChambre type);
    boolean existsByNumero(String numero);
}
