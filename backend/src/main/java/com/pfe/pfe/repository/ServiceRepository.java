package com.pfe.pfe.repository;

import com.pfe.pfe.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, String> {
    
    List<Service> findByCliniqueId(String cliniqueId);
    
    List<Service> findByCliniqueIdAndActifTrue(String cliniqueId);
    
    Optional<Service> findByNomAndCliniqueId(String nom, String cliniqueId);
    
    List<Service> findByActifTrue();
    
    long countByCliniqueId(String cliniqueId);
}
