#nullable enable
using System;
using Moq;
using Xunit;

namespace CampusEvents.Tests;

public class RegistrationValidatorTests
{
    private const int EventId = 10;
    private const string ValidEmail = "student@univ.edu.ph";

    // The database dependency is replaced by a mock, so no real database is used.
    private readonly Mock<IEventRepository> _repositoryMock = new Mock<IEventRepository>();

    private RegistrationValidator CreateValidator()
    {
        return new RegistrationValidator(_repositoryMock.Object);
    }

    // ---------- IsValidStudentEmail ----------

    [Theory]
    [InlineData("student@univ.edu.ph")]
    [InlineData("juan.delacruz@univ.edu.ph")]
    public void IsValidStudentEmail_ValidUniversityEmail_ReturnsTrue(string email)
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail(email);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValidStudentEmail_UppercaseDomain_ReturnsTrue()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail("STUDENT@UNIV.EDU.PH");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValidStudentEmail_LeadingAndTrailingSpaces_ReturnsTrue()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail("  student@univ.edu.ph  ");

        // Assert
        Assert.True(result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void IsValidStudentEmail_NullEmptyOrWhitespace_ReturnsFalse(string? email)
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail(email);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValidStudentEmail_WrongDomain_ReturnsFalse()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail("student@gmail.com");

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData("student@univ.edu.ph.evil.com")]
    [InlineData("student@evil.com")]
    [InlineData("student@univ.edu")]
    [InlineData("student@notuniv.edu.ph")]
    public void IsValidStudentEmail_LookalikeDomains_ReturnsFalse(string email)
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail(email);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValidStudentEmail_NoLocalPart_ReturnsFalse()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail("@univ.edu.ph");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValidStudentEmail_MultipleAtSigns_ReturnsFalse()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        bool result = validator.IsValidStudentEmail("a@b@univ.edu.ph");

        // Assert
        Assert.False(result);
    }

    // ---------- HasAvailableSeats (uses the mocked repository) ----------

    [Fact]
    public void HasAvailableSeats_SeatsAvailable_ReturnsTrue()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(25);
        var validator = CreateValidator();

        // Act
        bool result = validator.HasAvailableSeats(EventId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasAvailableSeats_ExactlyOneSeat_ReturnsTrue()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(1);
        var validator = CreateValidator();

        // Act
        bool result = validator.HasAvailableSeats(EventId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasAvailableSeats_ZeroSeats_ReturnsFalse()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(0);
        var validator = CreateValidator();

        // Act
        bool result = validator.HasAvailableSeats(EventId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HasAvailableSeats_EventNotFoundNegativeCount_ReturnsFalse()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(-1);
        var validator = CreateValidator();

        // Act
        bool result = validator.HasAvailableSeats(EventId);

        // Assert
        Assert.False(result);
    }

    // ---------- ValidateRegistration ----------

    [Fact]
    public void ValidateRegistration_ValidEmailAndSeats_ReturnsValidAndQueriesRepositoryOnce()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(5);
        var validator = CreateValidator();

        // Act
        var result = validator.ValidateRegistration(ValidEmail, EventId);

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal(string.Empty, result.Error);
        _repositoryMock.Verify(r => r.GetAvailableSeats(EventId), Times.Once());
    }

    [Fact]
    public void ValidateRegistration_InvalidEmail_ReturnsEmailErrorAndNeverQueriesRepository()
    {
        // Arrange
        var validator = CreateValidator();

        // Act
        var result = validator.ValidateRegistration("student@gmail.com", EventId);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal(RegistrationValidator.InvalidEmailMessage, result.Error);
        _repositoryMock.Verify(r => r.GetAvailableSeats(It.IsAny<int>()), Times.Never());
    }

    [Fact]
    public void ValidateRegistration_NoSeatsAvailable_ReturnsSeatError()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetAvailableSeats(EventId)).Returns(0);
        var validator = CreateValidator();

        // Act
        var result = validator.ValidateRegistration(ValidEmail, EventId);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal(RegistrationValidator.NoSeatsMessage, result.Error);
        _repositoryMock.Verify(r => r.GetAvailableSeats(EventId), Times.Once());
    }

    // ---------- Constructor guard ----------

    [Fact]
    public void Constructor_NullRepository_ThrowsArgumentNullException()
    {
        // Arrange, Act and Assert
        Assert.Throws<ArgumentNullException>(() => new RegistrationValidator(null!));
    }
}