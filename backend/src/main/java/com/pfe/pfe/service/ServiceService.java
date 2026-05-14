package com.pfe.pfe.service;

import com.pfe.pfe.dto.ServiceDTO;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.repository.ServiceRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceService {
    
    private final ServiceRepository serviceRepository;
    private final CliniqueRepository cliniqueRepository;
    
    /**
     * Initialiser les 6 services prédéfinis pour une clinique
     */
    public List<com.pfe.pfe.model.Service> initialiserServicesParDefaut(String cliniqueId) {
        // Vérifier que la clinique existe
        Clinique clinique = cliniqueRepository.findById(cliniqueId)
                .orElseThrow(() -> new IllegalArgumentException("Clinique non trouvée avec l'ID: " + cliniqueId));
        
        List<com.pfe.pfe.model.Service> servicesCreés = new ArrayList<>();
        
        // Données des 6 services prédéfinis
        String[][] servicesData = {
            {"Services médicaux et de soins", "Médecine générale, Médecine interne, Pédiatrie, Gériatrie, Cardiologie, Pneumologie, Gastroentérologie, Neurologie, Néphrologie, Endocrinologie, Infectiologie, Dermatologie, Oncologie, Psychiatrie"},
            {"Services chirurgicaux", "Chirurgie générale, Chirurgie orthopédique, Chirurgie vasculaire, Chirurgie digestive, Chirurgie urologique, Chirurgie gynécologique, Chirurgie ORL, Neurochirurgie, Chirurgie pédiatrique, Bloc opératoire"},
            {"Services maternels et infantiles", "Maternité, Pédiatrie, Néonatalogie, Service de réanimation néonatale"},
            {"Services d'appui médical", "Radiologie/Imagerie médicale (IRM, scanner, échographie), Laboratoire d'analyses biologiques, Pharmacie hospitalière, Stérilisation, Anatomopathologie"},
            {"Services médico-techniques", "Bloc opératoire, Stérilisation, Hôpital de jour, Hospitalisation de semaine, Dialyse, Explorations fonctionnelles (cardiaques, respiratoires, neurologiques)"},
            {"Services Uragence", "Extrêmement déçu par la prise en charge aux urgences ce jour."}
        };
        
        // Créer les services
        for (String[] data : servicesData) {
            // Vérifier que le service n'existe pas déjà
            if (serviceRepository.findByNomAndCliniqueId(data[0], cliniqueId).isEmpty()) {
                com.pfe.pfe.model.Service service = new com.pfe.pfe.model.Service();
                service.setNom(data[0]);
                service.setDescription(data[1]);
                service.setClinique(clinique);
                service.setActif(true);
                service.setDateCreation(LocalDateTime.now());
                service.setNombreChambres(0);
                service.setNombreLits(0);
                
                com.pfe.pfe.model.Service serviceCreé = serviceRepository.save(service);
                servicesCreés.add(serviceCreé);
            }
        }
        
        return servicesCreés;
    }
    
    /**
     * Créer un service
     */
    public com.pfe.pfe.model.Service creerService(ServiceDTO dto) {
        // Validation des champs obligatoires
        if (dto.getNom() == null || dto.getNom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du service est obligatoire");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("La description du service est obligatoire");
        }
        if (dto.getCliniqueId() == null || dto.getCliniqueId().trim().isEmpty()) {
            throw new IllegalArgumentException("L'ID de la clinique est obligatoire");
        }
        
        // Vérifier que la clinique existe
        Clinique clinique = cliniqueRepository.findById(dto.getCliniqueId())
                .orElseThrow(() -> new IllegalArgumentException("Clinique non trouvée avec l'ID: " + dto.getCliniqueId()));
        
        // Vérifier que le nom du service est unique dans la clinique
        serviceRepository.findByNomAndCliniqueId(dto.getNom().trim(), dto.getCliniqueId())
                .ifPresent(s -> {
                    throw new IllegalArgumentException("Un service avec le nom \"" + dto.getNom() + "\" existe déjà dans cette clinique");
                });
        
        com.pfe.pfe.model.Service service = new com.pfe.pfe.model.Service();
        service.setNom(dto.getNom().trim());
        service.setDescription(dto.getDescription().trim());
        service.setClinique(clinique);
        service.setActif(dto.getActif() != null ? dto.getActif() : true);
        service.setDateCreation(LocalDateTime.now());
        service.setNombreChambres(0);
        service.setNombreLits(0);
        
        return serviceRepository.save(service);
    }
    
    /**
     * Obtenir tous les services
     */
    public List<com.pfe.pfe.model.Service> obtenirTousLesServices() {
        return serviceRepository.findAll();
    }
    
    /**
     * Obtenir un service par ID
     */
    public com.pfe.pfe.model.Service obtenirServiceParId(String id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service non trouvé avec l'ID: " + id));
    }
    
    /**
     * Obtenir les services d'une clinique
     */
    public List<com.pfe.pfe.model.Service> obtenirServicesParClinique(String cliniqueId) {
        // Vérifier que la clinique existe
        if (!cliniqueRepository.existsById(cliniqueId)) {
            throw new IllegalArgumentException("Clinique non trouvée avec l'ID: " + cliniqueId);
        }
        
        return serviceRepository.findByCliniqueId(cliniqueId);
    }

    public List<com.pfe.pfe.model.Service> obtenirServicesActifsParClinique(String cliniqueId) {
        // Vérifier que la clinique existe
        if (!cliniqueRepository.existsById(cliniqueId)) {
            throw new IllegalArgumentException("Clinique non trouvée avec l'ID: " + cliniqueId);
        }
        
        return serviceRepository.findByCliniqueIdAndActifTrue(cliniqueId);
    }
    
    /**
     * Mettre à jour un service
     */
    public com.pfe.pfe.model.Service mettreAJourService(String id, ServiceDTO dto) {
        com.pfe.pfe.model.Service service = obtenirServiceParId(id);
        
        // Validation
        if (dto.getNom() != null && dto.getNom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du service ne peut pas être vide");
        }
        if (dto.getDescription() != null && dto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("La description du service ne peut pas être vide");
        }
        
        if (dto.getNom() != null && !dto.getNom().trim().equals(service.getNom())) {
            // Vérifier que le nouveau nom n'existe pas déjà dans la clinique
            String cliniqueId = service.getClinique() != null ? service.getClinique().getId() : null;
            if (cliniqueId != null) {
                serviceRepository.findByNomAndCliniqueId(dto.getNom().trim(), cliniqueId)
                        .ifPresent(s -> {
                            if (!s.getId().equals(id)) {
                                throw new IllegalArgumentException("Un service avec le nom \"" + dto.getNom() + "\" existe déjà dans cette clinique");
                            }
                        });
            }
            service.setNom(dto.getNom().trim());
        }
        
        if (dto.getDescription() != null) {
            service.setDescription(dto.getDescription().trim());
        }
        
        if (dto.getActif() != null) {
            service.setActif(dto.getActif());
        }
        
        return serviceRepository.save(service);
    }
    
    /**
     * Désactiver un service (soft delete)
     */
    public void desactiverService(String id) {
        com.pfe.pfe.model.Service service = obtenirServiceParId(id);
        service.setActif(false);
        serviceRepository.save(service);
    }

    /**
     * Supprimer définitivement un service et ses chambres
     */
    public void supprimerService(String id) {
        com.pfe.pfe.model.Service service = obtenirServiceParId(id);
        serviceRepository.delete(service);
    }
    
    /**
     * Obtenir le nombre de lits disponibles d'un service
     */
    public Integer obtenirLitsDisponibles(String id) {
        com.pfe.pfe.model.Service service = obtenirServiceParId(id);
        
        // Calculer le total de lits dans toutes les chambres du service
        int totalLits = service.getChambres().stream()
                .mapToInt(Chambre::getNombreLits)
                .sum();
        
        // Calculer les lits occupés dans les chambres non disponibles
        int litsOccupes = service.getChambres().stream()
                .filter(c -> !c.getDisponible())
                .mapToInt(Chambre::getNombreLits)
                .sum();
        
        return Math.max(0, totalLits - litsOccupes);
    }
}
