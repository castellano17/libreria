# Requirements Document

## Introduction

This document specifies the requirements for implementing a download tracking and favorites system in the biblioteca app. The system will track book download counts, provide popularity-based filtering, and allow users to mark books as favorites with persistent local storage.

## Glossary

- **Book**: A digital publication with metadata including title, author, genre, and file information
- **Download_Counter**: A system component that tracks and increments download counts for books
- **Favorites_Manager**: A system component that manages user favorite books using browser localStorage
- **Popularity_Filter**: A filtering mechanism that sorts books by download frequency over specified time periods
- **BookCard**: The UI component displaying book information in grid/list view
- **BookModal**: The detailed view component for individual books
- **Filter_Panel**: The UI component containing all book filtering options

## Requirements

### Requirement 1: Download Tracking

**User Story:** As a user, I want to see how popular books are based on download counts, so that I can discover trending and well-regarded content.

#### Acceptance Criteria

1. WHEN a user downloads a book file, THE Download_Counter SHALL increment the book's download count by one
2. WHEN displaying book information, THE BookCard SHALL show the current download count with format "⬇️ [count] descargas"
3. WHEN displaying book information on mobile devices, THE BookCard SHALL show abbreviated download count with format "[count] desc."
4. WHEN a user views book details, THE BookModal SHALL display the download count in the metadata section
5. THE Download_Counter SHALL persist download counts across application restarts

### Requirement 2: Popularity Filtering

**User Story:** As a user, I want to filter books by popularity over different time periods, so that I can find the most downloaded content for my interests.

#### Acceptance Criteria

1. WHEN a user accesses the popularity filter, THE Filter_Panel SHALL provide options for "semana", "mes", and "todo el tiempo"
2. WHEN a user selects "semana" filter, THE system SHALL return books ordered by downloads in the last 7 days
3. WHEN a user selects "mes" filter, THE system SHALL return books ordered by downloads in the last 30 days
4. WHEN a user selects "todo el tiempo" filter, THE system SHALL return books ordered by total download count
5. WHEN popularity filtering is active, THE system SHALL maintain other active filters simultaneously

### Requirement 3: Favorites Management

**User Story:** As a user, I want to mark books as favorites and easily access them later, so that I can quickly find books I'm interested in.

#### Acceptance Criteria

1. WHEN a user clicks the heart icon on a BookCard, THE Favorites_Manager SHALL toggle the book's favorite status
2. WHEN a user clicks the heart button in BookModal, THE Favorites_Manager SHALL toggle the book's favorite status
3. WHEN a book is marked as favorite, THE system SHALL display a filled heart icon
4. WHEN a book is not marked as favorite, THE system SHALL display an outlined heart icon
5. THE Favorites_Manager SHALL persist favorite status using browser localStorage
6. WHEN the application loads, THE Favorites_Manager SHALL restore favorite status from localStorage

### Requirement 4: Favorites Filtering

**User Story:** As a user, I want to filter to show only my favorite books, so that I can quickly access my preferred content.

#### Acceptance Criteria

1. WHEN a user activates the "Mis Favoritos" filter, THE system SHALL display only books marked as favorites
2. WHEN no books are marked as favorites, THE system SHALL display an appropriate empty state message
3. WHEN favorites filtering is active, THE system SHALL maintain other active filters simultaneously
4. WHEN a user removes a book from favorites while favorites filter is active, THE system SHALL immediately remove it from the displayed results

### Requirement 5: UI Integration

**User Story:** As a user, I want the new features to integrate seamlessly with the existing interface, so that the experience feels cohesive and intuitive.

#### Acceptance Criteria

1. WHEN displaying BookCards, THE heart icon SHALL appear as an overlay in the top-right corner of the book cover
2. WHEN displaying BookModal, THE heart button SHALL appear in the action buttons grid alongside existing buttons
3. WHEN displaying download counts, THE formatting SHALL be consistent with existing UI patterns
4. WHEN on mobile devices, THE UI elements SHALL remain accessible and properly sized
5. THE new filter options SHALL integrate with the existing filter panel layout

### Requirement 6: Data Persistence and Performance

**User Story:** As a system administrator, I want the download tracking to be efficient and reliable, so that the system performs well under load.

#### Acceptance Criteria

1. WHEN recording download events, THE system SHALL update the database efficiently without blocking the download
2. WHEN querying popular books, THE system SHALL use optimized database queries with appropriate indexing
3. WHEN storing favorites data, THE system SHALL handle localStorage quota limits gracefully
4. WHEN the browser localStorage is unavailable, THE system SHALL degrade gracefully without breaking functionality
5. THE system SHALL validate all download count increments to prevent manipulation

### Requirement 7: API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints for download tracking and popularity data, so that I can implement the UI features reliably.

#### Acceptance Criteria

1. THE system SHALL provide an endpoint to increment download counts when books are downloaded
2. THE system SHALL provide an endpoint to retrieve books filtered by popularity with time period parameters
3. THE system SHALL provide an endpoint to retrieve current download counts for books
4. WHEN API requests fail, THE system SHALL return appropriate HTTP status codes and error messages
5. THE system SHALL validate all API request parameters to prevent invalid data
