-- ============================================================================
-- Script: schema.sql
-- Description: Database Schema DDL for Online Campus Event Management System
-- Target RDBMS: Microsoft SQL Server (T-SQL)
-- Architecture: 3rd Normal Form (3NF)
-- Features: Re-runnable, Foreign Keys, Indexes, Constraints, Cascading Rules
-- ============================================================================

SET NOCOUNT ON;
GO

-- ============================================================================
-- 1. DROP EXISTING TABLES (REVERSE DEPENDENCY ORDER)
-- ============================================================================

IF OBJECT_ID('dbo.Registrations', 'U') IS NOT NULL DROP TABLE dbo.Registrations;
IF OBJECT_ID('dbo.Events', 'U') IS NOT NULL DROP TABLE dbo.Events;
IF OBJECT_ID('dbo.Venues', 'U') IS NOT NULL DROP TABLE dbo.Venues;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

-- ============================================================================
-- 2. CREATE TABLES (DEPENDENCY ORDER)
-- ============================================================================

-------------------------------------------------------------------------------
-- Table: Roles
-- Description: Lookup table for system authorization roles.
-------------------------------------------------------------------------------
CREATE TABLE dbo.Roles (
    RoleId INT IDENTITY(1,1) NOT NULL,
    RoleName VARCHAR(20) NOT NULL,

    -- Constraints
    CONSTRAINT PK_Roles_RoleId PRIMARY KEY CLUSTERED (RoleId),
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName),
    CONSTRAINT CK_Roles_RoleName CHECK (RoleName IN ('Student', 'Administrator'))
);
GO

-------------------------------------------------------------------------------
-- Table: Users
-- Description: System user accounts (Students and Administrators).
-------------------------------------------------------------------------------
CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) NOT NULL,
    RoleId INT NOT NULL,
    Email VARCHAR(255) NOT NULL,
    PasswordHash VARBINARY(64) NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSDATETIME()),

    -- Constraints
    CONSTRAINT PK_Users_UserId PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT FK_Users_Roles_RoleId FOREIGN KEY (RoleId)
        REFERENCES dbo.Roles (RoleId)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT CK_Users_Email_Format CHECK (Email LIKE '%_@__%.%_')
);
GO

-------------------------------------------------------------------------------
-- Table: Venues
-- Description: Physical locations available for hosting campus events.
-------------------------------------------------------------------------------
CREATE TABLE dbo.Venues (
    VenueId INT IDENTITY(1,1) NOT NULL,
    VenueName NVARCHAR(100) NOT NULL,
    Capacity INT NOT NULL,

    -- Constraints
    CONSTRAINT PK_Venues_VenueId PRIMARY KEY CLUSTERED (VenueId),
    CONSTRAINT UQ_Venues_VenueName UNIQUE (VenueName),
    CONSTRAINT CK_Venues_Capacity_Positive CHECK (Capacity > 0)
);
GO

-------------------------------------------------------------------------------
-- Table: Events
-- Description: Campus events created by Administrators.
-------------------------------------------------------------------------------
CREATE TABLE dbo.Events (
    EventId INT IDENTITY(1,1) NOT NULL,
    VenueId INT NOT NULL,
    CreatedByUserId INT NOT NULL,
    Title NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    StartDateTime DATETIME2(0) NOT NULL,
    EndDateTime DATETIME2(0) NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Events_CreatedAt DEFAULT (SYSDATETIME()),

    -- Constraints
    CONSTRAINT PK_Events_EventId PRIMARY KEY CLUSTERED (EventId),
    CONSTRAINT FK_Events_Venues_VenueId FOREIGN KEY (VenueId)
        REFERENCES dbo.Venues (VenueId)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT FK_Events_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId)
        REFERENCES dbo.Users (UserId)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT CK_Events_DateOrder CHECK (EndDateTime > StartDateTime)
);
GO

-------------------------------------------------------------------------------
-- Table: Registrations
-- Description: Event registration records linking Users to Events.
-------------------------------------------------------------------------------
CREATE TABLE dbo.Registrations (
    RegistrationId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    EventId INT NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Registrations_Status DEFAULT ('Registered'),
    RegistrationDate DATETIME2(0) NOT NULL CONSTRAINT DF_Registrations_RegistrationDate DEFAULT (SYSDATETIME()),

    -- Constraints
    CONSTRAINT PK_Registrations_RegistrationId PRIMARY KEY CLUSTERED (RegistrationId),
    
    -- Composite UNIQUE constraint preventing duplicate registrations
    CONSTRAINT UQ_Registrations_User_Event UNIQUE (UserId, EventId),
    
    CONSTRAINT FK_Registrations_Users_UserId FOREIGN KEY (UserId)
        REFERENCES dbo.Users (UserId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_Registrations_Events_EventId FOREIGN KEY (EventId)
        REFERENCES dbo.Events (EventId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT CK_Registrations_Status CHECK (Status IN ('Registered', 'Cancelled', 'Attended'))
);
GO

-- ============================================================================
-- 3. NON-CLUSTERED INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Index for FK: Users.RoleId
CREATE NONCLUSTERED INDEX IX_Users_RoleId
    ON dbo.Users (RoleId);
GO

-- Index for FK: Events.VenueId
CREATE NONCLUSTERED INDEX IX_Events_VenueId
    ON dbo.Events (VenueId);
GO

-- Index for FK: Events.CreatedByUserId
CREATE NONCLUSTERED INDEX IX_Events_CreatedByUserId
    ON dbo.Events (CreatedByUserId);
GO

-- Index for FK: Registrations.UserId
CREATE NONCLUSTERED INDEX IX_Registrations_UserId
    ON dbo.Registrations (UserId);
GO

-- Index for FK: Registrations.EventId
CREATE NONCLUSTERED INDEX IX_Registrations_EventId
    ON dbo.Registrations (EventId);
GO

-- ============================================================================
-- 4. SEED DATA (INITIAL ROLES)
-- ============================================================================

INSERT INTO dbo.Roles (RoleName)
VALUES ('Administrator'), ('Student');
GO