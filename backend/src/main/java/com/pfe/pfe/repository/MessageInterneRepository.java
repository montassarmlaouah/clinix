package com.pfe.pfe.repository;

import com.pfe.pfe.model.MessageInterne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageInterneRepository extends JpaRepository<MessageInterne, String> {

    List<MessageInterne> findByDestinataireIdOrderByDateEnvoiDesc(String destinataireId);

    List<MessageInterne> findByExpediteurIdOrderByDateEnvoiDesc(String expediteurId);

    List<MessageInterne> findByDestinataireIdAndLuFalseOrderByDateEnvoiDesc(String destinataireId);

    long countByDestinataireIdAndLuFalse(String destinataireId);

    @Query("SELECT m FROM MessageInterne m WHERE " +
           "(m.expediteur.id = :userId AND m.destinataire.id = :otherUserId) OR " +
           "(m.expediteur.id = :otherUserId AND m.destinataire.id = :userId) " +
           "ORDER BY m.dateEnvoi ASC")
    List<MessageInterne> findConversation(@Param("userId") String userId,
                                           @Param("otherUserId") String otherUserId);

    @Query("SELECT DISTINCT CASE WHEN m.expediteur.id = :userId THEN m.destinataire.id ELSE m.expediteur.id END " +
           "FROM MessageInterne m WHERE m.expediteur.id = :userId OR m.destinataire.id = :userId")
    List<String> findContactIds(@Param("userId") String userId);
}
