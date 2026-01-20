# Implementation Plan: Biblioteca Download Tracking and Favorites System

## Overview

This implementation plan converts the design into discrete coding tasks for building the download tracking and favorites system. The approach follows an incremental development strategy, implementing backend data models first, then API endpoints, followed by frontend components, and finally integration testing.

## Tasks

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create download tracking database migration
    - Add `download_count` column to books table with default 0
    - Create `download_events` table with book_id, timestamp, ip_address, user_agent
    - Add appropriate indexes for performance optimization
    - _Requirements: 1.5, 6.2_

  - [ ] 1.2 Update SQLAlchemy Book model
    - Add `download_count` field with proper mapping and default value
    - Ensure existing book queries include download count
    - _Requirements: 1.1, 1.4_

  - [ ] 1.3 Create DownloadEvent SQLAlchemy model
    - Define model with foreign key relationship to Book
    - Add timestamp field with automatic default
    - Include optional IP address and user agent tracking
    - _Requirements: 6.1, 6.5_

  - [ ] 1.4 Write property test for download count persistence
    - **Property 1: Download Counter Atomicity and Persistence**
    - **Validates: Requirements 1.1, 1.5**

- [ ] 2. Implement download counter service
  - [ ] 2.1 Create DownloadCounterService class
    - Implement atomic increment_download_count method using SQLAlchemy update
    - Add get_download_count method for retrieving current counts
    - Include proper error handling and validation
    - _Requirements: 1.1, 6.1, 6.5_

  - [ ] 2.2 Implement time-based popularity filtering
    - Add get_popular_books method with time period parameters
    - Use efficient database queries with proper date filtering
    - Support week, month, and all-time filtering options
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 2.3 Write property test for time-based filtering
    - **Property 4: Time-based Popularity Filtering**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [ ] 2.4 Write property test for download event processing
    - **Property 13: Download Event Processing**
    - **Validates: Requirements 6.1**

- [ ] 3. Create API endpoints for download tracking
  - [ ] 3.1 Implement download increment endpoint
    - Create POST /api/books/{book_id}/download endpoint
    - Add request validation and rate limiting
    - Return appropriate HTTP status codes and error messages
    - _Requirements: 7.1, 7.4, 7.5_

  - [ ] 3.2 Implement popularity filtering endpoint
    - Create GET /api/books/popular endpoint with time period parameters
    - Integrate with DownloadCounterService for data retrieval
    - Support pagination and limit parameters
    - _Requirements: 7.2, 2.2, 2.3, 2.4_

  - [ ] 3.3 Update existing books endpoint
    - Modify GET /api/books to include download_count in response
    - Ensure backward compatibility with existing API consumers
    - _Requirements: 7.3, 1.2, 1.4_

  - [ ] 3.4 Write property test for API error handling
    - **Property 15: API Error Handling**
    - **Validates: Requirements 7.4, 7.5**

  - [ ] 3.5 Write unit tests for API endpoints
    - Test download increment with valid and invalid book IDs
    - Test popularity filtering with different time periods
    - Test error conditions and edge cases
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4. Checkpoint - Backend functionality complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [ ] 5. Implement frontend favorites management
  - [ ] 5.1 Create useFavorites React hook
    - Implement localStorage-based favorites management
    - Add error handling for quota exceeded and unavailable storage
    - Include cross-tab synchronization using storage events
    - _Requirements: 3.5, 3.6, 6.3, 6.4_

  - [ ] 5.2 Add favorites toggle functionality
    - Implement toggleFavorite function with localStorage persistence
    - Add isFavorite check function for UI state management
    - Include clearFavorites utility for testing and user preferences
    - _Requirements: 3.1, 3.2_

  - [ ] 5.3 Write property test for favorites persistence
    - **Property 8: Favorites Persistence Round-trip**
    - **Validates: Requirements 3.5, 3.6**

  - [ ] 5.4 Write property test for favorites toggle consistency
    - **Property 6: Favorites Toggle Consistency**
    - **Validates: Requirements 3.1, 3.2**

- [ ] 6. Update BookCard component
  - [ ] 6.1 Add download counter display
    - Implement responsive download count formatting
    - Show "⬇️ [count] descargas" on desktop, "[count] desc." on mobile
    - Position counter below file size information
    - _Requirements: 1.2, 1.3, 5.3_

  - [ ] 6.2 Add heart icon overlay
    - Position heart icon in top-right corner of book cover
    - Implement filled/outlined states based on favorite status
    - Add click handler for toggling favorite status
    - _Requirements: 3.3, 3.4, 5.1_

  - [ ] 6.3 Integrate with favorites hook
    - Connect BookCard to useFavorites hook for state management
    - Ensure proper re-rendering when favorite status changes
    - _Requirements: 3.1, 5.1_

  - [ ] 6.4 Write property test for UI formatting consistency
    - **Property 2: UI Formatting Consistency**
    - **Validates: Requirements 1.2, 1.3, 5.3**

  - [ ]\* 6.5 Write property test for heart icon state display
    - **Property 7: Heart Icon State Display**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 7. Update BookModal component
  - [ ] 7.1 Add download count to metadata section
    - Display current download count in book details
    - Ensure consistent formatting with BookCard
    - _Requirements: 1.4, 5.3_

  - [ ] 7.2 Add heart button to action buttons grid
    - Position heart button alongside existing action buttons
    - Implement same toggle functionality as BookCard
    - Maintain consistent styling with existing buttons
    - _Requirements: 3.2, 5.2_

  - [ ] 7.3 Update download button functionality
    - Integrate download button with new API endpoint
    - Ensure download count increments when file is downloaded
    - Handle API errors gracefully
    - _Requirements: 1.1, 6.1_

  - [ ]\* 7.4 Write property test for download count display
    - **Property 3: Download Count Display Completeness**
    - **Validates: Requirements 1.4**

  - [ ]\* 7.5 Write property test for UI element positioning
    - **Property 11: UI Element Positioning Consistency**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 8. Implement filtering functionality
  - [ ] 8.1 Add popularity filter to Filter Panel
    - Create dropdown with "semana", "mes", "todo el tiempo" options
    - Integrate with existing filter state management
    - Call popularity API endpoint when filter is selected
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 8.2 Add favorites filter option
    - Add "Mis Favoritos" toggle to filter panel
    - Filter displayed books based on localStorage favorites
    - Show appropriate empty state when no favorites exist
    - _Requirements: 4.1, 4.2_

  - [ ] 8.3 Implement filter combination logic
    - Ensure popularity and favorites filters work with existing filters
    - Maintain all active filters when new filters are applied
    - Update URL parameters to reflect filter state
    - _Requirements: 2.5, 4.3_

  - [ ]\* 8.4 Write property test for filter combination preservation
    - **Property 5: Filter Combination Preservation**
    - **Validates: Requirements 2.5, 4.3**

  - [ ]\* 8.5 Write property test for favorites filtering accuracy
    - **Property 9: Favorites Filtering Accuracy**
    - **Validates: Requirements 4.1**

  - [ ]\* 8.6 Write property test for real-time favorites update
    - **Property 10: Real-time Favorites Update**
    - **Validates: Requirements 4.4**

- [ ] 9. Implement responsive design and accessibility
  - [ ] 9.1 Ensure mobile compatibility
    - Test all new UI elements on mobile devices
    - Verify touch targets meet accessibility guidelines
    - Ensure proper scaling and positioning
    - _Requirements: 5.4_

  - [ ] 9.2 Add accessibility attributes
    - Include proper ARIA labels for heart icons and download counters
    - Ensure keyboard navigation works for all new interactive elements
    - Add screen reader support for dynamic content updates
    - _Requirements: 5.4_

  - [ ]\* 9.3 Write property test for responsive design accessibility
    - **Property 12: Responsive Design Accessibility**
    - **Validates: Requirements 5.4**

- [ ] 10. Integration and final testing
  - [ ] 10.1 Wire all components together
    - Ensure proper data flow between frontend and backend
    - Test end-to-end functionality with real API calls
    - Verify error handling works across all components
    - _Requirements: All requirements_

  - [ ]\* 10.2 Write integration tests
    - Test complete user workflows (download, favorite, filter)
    - Verify cross-component state synchronization
    - Test error scenarios and recovery
    - _Requirements: All requirements_

  - [ ]\* 10.3 Write property test for input validation integrity
    - **Property 14: Input Validation Integrity**
    - **Validates: Requirements 6.5**

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality
- Checkpoints provide opportunities for validation and user feedback
