#nullable enable
using System;
using System.Linq;

namespace CampusEvents;

/// <summary>
/// Abstraction over the database lookup for seat counts.
/// Unit tests replace this with a Moq mock so no real database is needed.
/// </summary>
public interface IEventRepository
{
    /// <summary>
    /// Returns the number of seats still available for the event.
    /// Returns 0 (or a negative number) when the event is full or does not exist.
    /// </summary>
    int GetAvailableSeats(int eventId);
}

/// <summary>
/// Core validation routine for event registration:
/// (1) the student email must belong to the @univ.edu.ph domain, and
/// (2) the chosen event must still have at least one available seat.
/// </summary>
public class RegistrationValidator
{
    public const string RequiredDomain = "@univ.edu.ph";
    public const string InvalidEmailMessage = "Email must be a valid address ending with @univ.edu.ph.";
    public const string NoSeatsMessage = "No seats are available for this event.";

    private readonly IEventRepository _eventRepository;

    public RegistrationValidator(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository
            ?? throw new ArgumentNullException(nameof(eventRepository));
    }

    /// <summary>
    /// Returns true only when the email has a non-empty local part followed by
    /// exactly "@univ.edu.ph". The domain must match at the END of the address, so
    /// lookalikes such as "student@univ.edu.ph.evil.com" are rejected.
    /// </summary>
    public bool IsValidStudentEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        string trimmed = email.Trim();

        // Anchored, case-insensitive suffix check (not Contains).
        if (!trimmed.EndsWith(RequiredDomain, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Everything before the domain is the local part.
        string localPart = trimmed.Substring(0, trimmed.Length - RequiredDomain.Length);

        // Must not be empty, contain another '@', or contain whitespace.
        return localPart.Length > 0
            && !localPart.Contains('@')
            && !localPart.Any(char.IsWhiteSpace);
    }

    /// <summary>
    /// Returns true when the repository reports at least one seat for the event.
    /// </summary>
    public bool HasAvailableSeats(int eventId)
    {
        return _eventRepository.GetAvailableSeats(eventId) > 0;
    }

    /// <summary>
    /// Validates the email first; the repository is only queried when the email is valid.
    /// </summary>
    public (bool IsValid, string Error) ValidateRegistration(string? email, int eventId)
    {
        if (!IsValidStudentEmail(email))
        {
            return (false, InvalidEmailMessage);
        }

        if (!HasAvailableSeats(eventId))
        {
            return (false, NoSeatsMessage);
        }

        return (true, string.Empty);
    }
}