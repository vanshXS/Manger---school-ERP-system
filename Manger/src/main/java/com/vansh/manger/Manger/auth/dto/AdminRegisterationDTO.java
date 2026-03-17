package com.vansh.manger.Manger.auth.dto;

import jakarta.persistence.Column;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AdminRegisterationDTO {

    @NotBlank(message = "fullName is required")
    @Size(min = 3, max = 20)
    private String fullName;
    @Email(message = "Email should be valid")
    @Column(nullable = false, unique = true)
    private String email;

   @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\d)(?=.*[@$!%*?&])[A-Za-z\\\\d@$!%*?&]{8,}$", message = "At least 8 characters\n" +
           "// - At least 1 uppercase letter (A-Z)\n" +
           "// - At least 1 lowercase letter (a-z)\n" +
           "// - At least 1 number (0-9)\n" +
           "// - At least 1 special character")
    private String password;
}
