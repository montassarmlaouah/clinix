package com.pfe.pfe.repository;

import com.pfe.pfe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByTelephone(String telephone);
    boolean existsByTelephone(String telephone);
    boolean existsByTelephoneAndIdNot(String telephone, String id);

    boolean existsByNumeroPieceIdentite(String numeroPieceIdentite);

    boolean existsByNumeroPieceIdentiteAndIdNot(String numeroPieceIdentite, String id);

    Optional<User> findByNumeroPieceIdentite(String numeroPieceIdentite);
}
