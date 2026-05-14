package com.pfe.pfe.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.ChambreDTO;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.repository.ChambreRepository;
import com.pfe.pfe.repository.EquipementRepository;
import com.pfe.pfe.repository.ServiceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ChambreService {
    
    private final ChambreRepository chambreRepository;
    private final ServiceRepository serviceRepository;
    private final EquipementRepository equipementRepository;
    

    public List<Chambre> creerPlusieursChambres(com.pfe.pfe.dto.CreationChambresDTO dto) {
        if (dto.getNombreChambres() == null || dto.getNombreChambres() < 1) {
            throw new RuntimeException("Le nombre de chambres doit être au moins 1");
        }
        if (dto.getNombreChambres() > 100) {
            throw new RuntimeException("Vous ne pouvez pas créer plus de 100 chambres à la fois");
        }
        
        // Charger le service
        com.pfe.pfe.model.Service service = serviceRepository.findById(dto.getServiceId())
            .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + dto.getServiceId()));
        
        // Valeurs par défaut
        Chambre.TypeChambre type = dto.getType() != null ? dto.getType() : Chambre.TypeChambre.SIMPLE;
        Integer capacite = dto.getCapacite() != null ? dto.getCapacite() : 1;
        Integer nombreLits = dto.getNombreLits() != null ? dto.getNombreLits() : 1;
        Boolean disponible = dto.getDisponible() != null ? dto.getDisponible() : true;
        String prefixe = dto.getPrefixeNumero() != null ? dto.getPrefixeNumero() : "";
        Integer numeroDebut = dto.getNumeroDebut() != null ? dto.getNumeroDebut() : 1;
        
        List<Chambre> chambresCreees = new java.util.ArrayList<>();
        
        for (int i = 0; i < dto.getNombreChambres(); i++) {
            Chambre chambre = new Chambre();
            chambre.setId(null);
            chambre.setService(service);
            chambre.setType(type);
            chambre.setCapacite(capacite);
            chambre.setNombreLits(nombreLits);
            chambre.setDisponible(disponible);
            
            // Générer le numéro de chambre
            String numero;
            if (prefixe.isEmpty()) {
                numero = String.valueOf(numeroDebut + i);
            } else {
                numero = prefixe + (numeroDebut + i);
            }
            
            // Vérifier si le numéro existe déjà
            if (chambreRepository.findByNumero(numero).isPresent()) {
                // Essayer avec un suffixe
                int suffixe = 1;
                String numeroTentatif = numero + "-" + suffixe;
                while (chambreRepository.findByNumero(numeroTentatif).isPresent()) {
                    suffixe++;
                    numeroTentatif = numero + "-" + suffixe;
                }
                numero = numeroTentatif;
            }
            
            chambre.setNumero(numero);
            
            // Copier les équipements et matériels
            if (dto.getEquipements() != null) {
                chambre.setEquipements(new java.util.ArrayList<>(dto.getEquipements()));
            }
            if (dto.getMaterielIds() != null) {
                chambre.setMaterielIds(new java.util.ArrayList<>(dto.getMaterielIds()));
                ajusterStockMateriels(null, chambre.getMaterielIds());
            }
            
            // Validation
            validerChambre(chambre);
            
            // Sauvegarder
            Chambre chambreCreee = chambreRepository.save(chambre);
            chambresCreees.add(chambreCreee);
        }
        
        // Mettre à jour les compteurs du service
        mettreAJourCompteursService(service.getId());
        
        return chambresCreees;
    }
    
    public Chambre creerChambre(ChambreDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Les données de la chambre sont obligatoires");
        }
        if (dto.getServiceId() == null || dto.getServiceId().trim().isEmpty()) {
            throw new RuntimeException("Le service est obligatoire");
        }
        Chambre chambre = new Chambre();
        chambre.setNumero(dto.getNumero());
        chambre.setType(dto.getType());
        chambre.setCapacite(dto.getCapacite());
        chambre.setNombreLits(dto.getNombreLits());
        chambre.setDisponible(dto.getDisponible());
        chambre.setEquipements(dto.getEquipements());
        chambre.setMaterielIds(dto.getMaterielIds());

        com.pfe.pfe.model.Service service = serviceRepository.findById(dto.getServiceId())
            .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + dto.getServiceId()));
        chambre.setService(service);

        return creerChambre(chambre);
    }

    public Chambre creerChambre(Chambre chambre) {
        // Forcer l'ID à null pour éviter les conflits (l'ID sera auto-généré)
        chambre.setId(null);
        
        // Charger le service si seul l'ID est fourni
        if (chambre.getService() != null && chambre.getService().getId() != null) {
            com.pfe.pfe.model.Service service = serviceRepository.findById(chambre.getService().getId())
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + chambre.getService().getId()));
            chambre.setService(service);
        } else {
            throw new RuntimeException("Le service est obligatoire");
        }
        
        // Validation métier
        validerChambre(chambre);
        
        // Vérifier si le numéro de chambre existe déjà
        if (chambre.getNumero() == null || chambre.getNumero().trim().isEmpty()) {
            throw new RuntimeException("Le numéro de chambre est obligatoire");
        }
        if (chambreRepository.findByNumero(chambre.getNumero().trim()).isPresent()) {
            throw new RuntimeException("Une chambre avec le numéro " + chambre.getNumero() + " existe déjà");
        }
        
        // Valeurs par défaut
        if (chambre.getDisponible() == null) {
            chambre.setDisponible(true);
        }
        if (chambre.getNombreLits() == null || chambre.getNombreLits() < 1) {
            chambre.setNombreLits(1);
        }
        if (chambre.getCapacite() == null || chambre.getCapacite() < 1) {
            chambre.setCapacite(chambre.getNombreLits());
        }
        
        chambre.setNumero(chambre.getNumero().trim());
        if (chambre.getMaterielIds() != null) {
            ajusterStockMateriels(null, chambre.getMaterielIds());
        }
        Chambre nouvelleChambre = chambreRepository.save(chambre);
        
        // Mettre à jour les compteurs du service parent
        mettreAJourCompteursService(chambre.getService().getId());
        
        return nouvelleChambre;
    }
    
    public List<Chambre> obtenirToutesLesChambres() {
        return chambreRepository.findAll();
    }

    public List<Chambre> obtenirChambresParClinique(String cliniqueId) {
        if (cliniqueId == null || cliniqueId.trim().isEmpty()) {
            throw new RuntimeException("CliniqueId est obligatoire");
        }
        return chambreRepository.findByServiceCliniqueId(cliniqueId);
    }
    
    public Chambre obtenirChambreParId(String id) {
        return chambreRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Chambre non trouvée"));
    }
    
    public List<Chambre> obtenirChambresDisponibles() {
        return chambreRepository.findByDisponible(true);
    }
    
    public List<Chambre> obtenirChambresParType(String typeChambre) {
        return chambreRepository.findByType(Chambre.TypeChambre.valueOf(typeChambre));
    }
    
    public Chambre mettreAJourChambre(String id, ChambreDTO chambreDetails) {
        if (chambreDetails == null) {
            throw new RuntimeException("Les données de la chambre sont obligatoires");
        }
        Chambre chambre = obtenirChambreParId(id);
        String ancienServiceId = chambre.getService() != null ? chambre.getService().getId() : null;

        com.pfe.pfe.model.Service service = null;
        if (chambreDetails.getServiceId() != null && !chambreDetails.getServiceId().trim().isEmpty()) {
            service = serviceRepository.findById(chambreDetails.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + chambreDetails.getServiceId()));
        } else if (chambre.getService() != null) {
            service = chambre.getService();
        } else {
            throw new RuntimeException("Le service est obligatoire");
        }

        if (chambreDetails.getNumero() != null && !chambreDetails.getNumero().trim().isEmpty()
            && !chambre.getNumero().equals(chambreDetails.getNumero().trim())) {
            if (chambreRepository.findByNumero(chambreDetails.getNumero().trim()).isPresent()) {
                throw new RuntimeException("Une chambre avec le numéro " + chambreDetails.getNumero() + " existe déjà");
            }
        }

        if (chambreDetails.getNumero() != null && !chambreDetails.getNumero().trim().isEmpty()) {
            chambre.setNumero(chambreDetails.getNumero().trim());
        }
        if (chambreDetails.getType() != null) {
            chambre.setType(chambreDetails.getType());
        }
        if (chambreDetails.getCapacite() != null) {
            chambre.setCapacite(chambreDetails.getCapacite());
        }
        if (chambreDetails.getNombreLits() != null) {
            chambre.setNombreLits(chambreDetails.getNombreLits());
        }
        if (chambreDetails.getDisponible() != null) {
            chambre.setDisponible(chambreDetails.getDisponible());
        }
        if (chambreDetails.getEquipements() != null) {
            chambre.setEquipements(chambreDetails.getEquipements());
        }
        if (chambreDetails.getMaterielIds() != null) {
            ajusterStockMateriels(chambre.getMaterielIds(), chambreDetails.getMaterielIds());
            chambre.setMaterielIds(chambreDetails.getMaterielIds());
        }
        chambre.setService(service);

        validerChambre(chambre);

        Chambre chambreMaj = chambreRepository.save(chambre);

        if (ancienServiceId != null) {
            mettreAJourCompteursService(ancienServiceId);
        }
        if (service != null && (ancienServiceId == null || !ancienServiceId.equals(service.getId()))) {
            mettreAJourCompteursService(service.getId());
        }

        return chambreMaj;
    }

    public Chambre mettreAJourChambre(String id, Chambre chambreDetails) {
        Chambre chambre = obtenirChambreParId(id);
        String ancienServiceId = chambre.getService() != null ? chambre.getService().getId() : null;

        // Charger le service si un serviceId est fourni
        com.pfe.pfe.model.Service service = null;
        if (chambreDetails.getService() != null && chambreDetails.getService().getId() != null) {
            service = serviceRepository.findById(chambreDetails.getService().getId())
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + chambreDetails.getService().getId()));
        } else if (chambre.getService() != null) {
            // Conserver le service existant si aucun nouveau service n'est fourni
            service = chambre.getService();
        } else {
            throw new RuntimeException("Le service est obligatoire");
        }
        
        // Vérifier si le nouveau numéro existe déjà pour une autre chambre
        if (chambreDetails.getNumero() != null && !chambre.getNumero().equals(chambreDetails.getNumero())) {
            if (chambreRepository.findByNumero(chambreDetails.getNumero()).isPresent()) {
                throw new RuntimeException("Une chambre avec le numéro " + chambreDetails.getNumero() + " existe déjà");
            }
        }

        // Mettre à jour les champs
        if (chambreDetails.getNumero() != null && !chambreDetails.getNumero().trim().isEmpty()) {
            chambre.setNumero(chambreDetails.getNumero().trim());
        }
        if (chambreDetails.getType() != null) {
            chambre.setType(chambreDetails.getType());
        }
        if (chambreDetails.getCapacite() != null) {
            chambre.setCapacite(chambreDetails.getCapacite());
        }
        if (chambreDetails.getNombreLits() != null) {
            chambre.setNombreLits(chambreDetails.getNombreLits());
        }
        if (chambreDetails.getDisponible() != null) {
            chambre.setDisponible(chambreDetails.getDisponible());
        }
        if (chambreDetails.getEquipements() != null) {
            chambre.setEquipements(chambreDetails.getEquipements());
        }
        if (chambreDetails.getMaterielIds() != null) {
            ajusterStockMateriels(chambre.getMaterielIds(), chambreDetails.getMaterielIds());
            chambre.setMaterielIds(chambreDetails.getMaterielIds());
        }
        chambre.setService(service);
        
        // Validation après mise à jour
        validerChambre(chambre);

        Chambre chambreMaj = chambreRepository.save(chambre);
        
        // Mettre à jour les compteurs du service
        if (ancienServiceId != null) {
            mettreAJourCompteursService(ancienServiceId);
        }
        if (service != null && (ancienServiceId == null || !ancienServiceId.equals(service.getId()))) {
            mettreAJourCompteursService(service.getId());
        }
        
        return chambreMaj;
    }
    
    public void supprimerChambre(String id) {
        // Si la chambre n'existe pas (ex: double-clic / double requête), on considère l'opération comme idempotente
        // afin d'éviter une erreur inutile côté client.
        java.util.Optional<Chambre> chambreOpt = chambreRepository.findById(id);
        if (chambreOpt.isEmpty()) {
            return;
        }
        Chambre chambre = chambreOpt.get();
        
        if (!chambre.getDisponible()) {
            throw new RuntimeException("Impossible de supprimer une chambre occupée");
        }
        
        String serviceId = chambre.getService().getId();
        
        // 🔁 Restituer le matériel utilisé dans cette chambre au stock magasin
        if (chambre.getMaterielIds() != null && !chambre.getMaterielIds().isEmpty()) {
            // anciens = liste actuelle, nouveaux = liste vide → tout est "retiré" des chambres
            ajusterStockMateriels(chambre.getMaterielIds(), java.util.List.of());
        }
        
        chambreRepository.delete(chambre);
        
        // Mettre à jour les compteurs du service parent
        mettreAJourCompteursService(serviceId);
    }
    
    public List<Chambre> obtenirChambresParService(String serviceId) {
        return chambreRepository.findByServiceId(serviceId);
    }

    public boolean numeroExiste(String numero) {
        return chambreRepository.existsByNumero(numero);
    }

    public Map<String, Object> obtenirStatistiques() {
        List<Chambre> chambres = chambreRepository.findAll();

        long total = chambres.size();
        long disponibles = chambres.stream().filter(c -> Boolean.TRUE.equals(c.getDisponible())).count();
        long occupees = total - disponibles;

        Map<String, Long> parType = chambres.stream()
                .filter(c -> c.getType() != null)
                .collect(Collectors.groupingBy(c -> c.getType().name(), Collectors.counting()));

        return Map.of(
                "total", total,
                "disponibles", disponibles,
                "occupees", occupees,
                "parType", parType
        );
    }
    
    public Chambre ajouterEquipements(String id, List<String> equipements) {
        Chambre chambre = obtenirChambreParId(id);
        
        if (chambre.getEquipements() == null) {
            chambre.setEquipements(new java.util.ArrayList<>());
        }
        
        // Ajouter seulement les équipements qui n'existent pas déjà
        for (String equipement : equipements) {
            if (!chambre.getEquipements().contains(equipement)) {
                chambre.getEquipements().add(equipement);
            }
        }
        
        return chambreRepository.save(chambre);
    }
    
    public Chambre supprimerEquipement(String id, String equipement) {
        Chambre chambre = obtenirChambreParId(id);
        
        if (chambre.getEquipements() != null) {
            chambre.getEquipements().remove(equipement);
        }
        
        return chambreRepository.save(chambre);
    }

    private void ajusterStockMateriels(List<String> anciensIds, List<String> nouveauxIds) {
        java.util.Set<String> anciens = new java.util.HashSet<>(anciensIds != null ? anciensIds : java.util.List.of());
        java.util.Set<String> nouveaux = new java.util.HashSet<>(nouveauxIds != null ? nouveauxIds : java.util.List.of());

        java.util.Set<String> ajoutes = new java.util.HashSet<>(nouveaux);
        ajoutes.removeAll(anciens);

        java.util.Set<String> retires = new java.util.HashSet<>(anciens);
        retires.removeAll(nouveaux);

        for (String id : ajoutes) {
            ajusterQuantite(id, -1, Equipement.TypeLocalisation.CHAMBRE, Equipement.StatutEquipement.UTILISE);
        }

        for (String id : retires) {
            ajusterQuantite(id, 1, Equipement.TypeLocalisation.MAGASIN, Equipement.StatutEquipement.DISPONIBLE);
        }
    }

    private void ajusterQuantite(String equipementId, int delta,
                                 Equipement.TypeLocalisation localisation,
                                 Equipement.StatutEquipement statut) {
        Equipement equipement = equipementRepository.findById(equipementId)
            .orElseThrow(() -> new RuntimeException("Équipement introuvable: " + equipementId));

        int quantiteActuelle = equipement.getQuantite() != null ? equipement.getQuantite() : 0;
        int nouvelleQuantite = quantiteActuelle + delta;
        if (nouvelleQuantite < 0) {
            throw new RuntimeException("Quantité insuffisante pour l'équipement: " + equipement.getNom());
        }

        equipement.setQuantite(nouvelleQuantite);
        equipement.setTypeLocalisation(localisation);
        equipement.setStatut(statut);
        equipementRepository.save(equipement);
    }
    
    /**
     * Valide les règles métier de la chambre
     */
    private void validerChambre(Chambre chambre) {
        // Chargement du service complet si nécessaire pour avoir le nom
        com.pfe.pfe.model.Service service = chambre.getService();
        if (service == null || service.getId() == null) {
            // Si pas de service, on ne peut pas valider (ou on bloque)
            // Dans ce contexte, un service est obligatoire.
             throw new RuntimeException("Le service est obligatoire");
        }
        
        // Si le nom n'est pas rempli (cas où on a juste l'ID), on le charge
        if (service.getNom() == null) {
            service = serviceRepository.findById(service.getId())
                .orElseThrow(() -> new RuntimeException("Service non trouvé"));
            chambre.setService(service);
        }

        // Règle : Si le service est "Standard", le numéro de chambre doit être entre 100 et 150
        if (service.getNom().toLowerCase().contains("standard")) {
            try {
                int numero = Integer.parseInt(chambre.getNumero());
                if (numero < 100 || numero > 150) {
                    throw new RuntimeException("Pour le service Standard, le numéro de chambre doit être compris entre 100 et 150");
                }
            } catch (NumberFormatException e) {
                // Si le numéro n'est pas un entier valide
                throw new RuntimeException("Pour le service Standard, le numéro de chambre doit être un nombre valide");
            }
        }
    }

    /**
     * Met à jour automatiquement les compteurs nombre_chambres et nombre_lits
     * d'un service en fonction de ses chambres réelles
     */
    private void mettreAJourCompteursService(String serviceId) {
        com.pfe.pfe.model.Service service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new RuntimeException("Service non trouvé"));
        
        List<Chambre> chambres = chambreRepository.findByServiceId(serviceId);
        
        // Calculer le nombre total de chambres
        int nombreChambres = chambres.size();
        
        // Calculer le nombre total de lits
        int nombreLits = chambres.stream()
            .mapToInt(Chambre::getNombreLits)
            .sum();
        
        // Mettre à jour le service
        service.setNombreChambres(nombreChambres);
        service.setNombreLits(nombreLits);
        serviceRepository.save(service);
    }
}
