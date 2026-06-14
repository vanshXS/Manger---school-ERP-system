package com.vansh.manger.Manger.common.exception;

import com.vansh.manger.Manger.common.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.JDBCException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


@RestControllerAdvice
public class GlobalExceptionHandler {

    /* -------------------------------------------------
       1. Validation Errors (DTO / form binding)
       ------------------------------------------------- */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex
    ) {
        return buildValidationErrorResponse(ex.getBindingResult());
    }

    /** Handles BindException (e.g. @ModelAttribute validation in some cases). */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException ex) {
        return buildValidationErrorResponse(ex.getBindingResult());
    }

    private ResponseEntity<ErrorResponse> buildValidationErrorResponse(
            org.springframework.validation.BindingResult bindingResult
    ) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : bindingResult.getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        ErrorResponse response = new ErrorResponse(
                "Validation failed",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ErrorResponse> handleNullPointerException(NullPointerException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Null pointer exception";
        return buildErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /* -------------------------------------------------
       2. Illegal Argument (Bad input / ID / params)
       ------------------------------------------------- */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex
    ) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }



    /* -------------------------------------------------
       3. Entity Not Found (JPA / resource not found)
       ------------------------------------------------- */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /* -------------------------------------------------
       4. Username Not Found
       ------------------------------------------------- */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFoundException(
            UsernameNotFoundException ex
    ) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /* -------------------------------------------------
       5. IO Exceptions (File upload, streams, etc.)
       ------------------------------------------------- */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<ErrorResponse> handleIOException(IOException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    /* -------------------------------------------------
       5. Illegal State (Business rule violations)
       ------------------------------------------------- */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(
            IllegalStateException ex
    ) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    /* -------------------------------------------------
       6. JDBC / Database Exceptions
       ------------------------------------------------- */
    @ExceptionHandler(JDBCException.class)
    public ResponseEntity<ErrorResponse> handleJDBCException(JDBCException ex) {
        return buildErrorResponse("Database error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /* -------------------------------------------------
       7. Runtime Exception (Catch-all fallback)
       ------------------------------------------------- */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /* -------------------------------------------------
       8. Custom Business Exceptions
       ------------------------------------------------- */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleException(BusinessRuleException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(DuplicateResourceException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    /* -------------------------------------------------
       Helper Method
       ------------------------------------------------- */
    private ResponseEntity<ErrorResponse> buildErrorResponse(
            String message,
            HttpStatus status
    ) {
        ErrorResponse response = new ErrorResponse(
                message,
                status.value(),
                LocalDateTime.now()
        );

        return ResponseEntity.status(status).body(response);
    }
}
