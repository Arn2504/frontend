#nullable enable
using System;
using System.Data;
using Microsoft.Data.SqlClient;

namespace CampusEvents;

/// <summary>
/// Secure refactor of the flawed GetUserRegistration method.
/// Fixes: SQL injection, unmanaged resource leak, hardcoded credentials,
/// NullReferenceException on "no record found", and unnecessary SELECT *.
/// </summary>
public class RegistrationService
{
    private readonly string _connectionString;

    // FIX: credentials are no longer hardcoded in the method.
    // The connection string is injected (e.g., from configuration or an environment variable).
    public RegistrationService(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("A connection string is required.", nameof(connectionString));
        }

        _connectionString = connectionString;
    }

    /// <summary>
    /// Returns the registration id for the given email, or null when no record exists.
    /// </summary>
    public string? GetUserRegistration(string inputEmail)
    {
        // FIX: reject empty input before touching the database.
        if (string.IsNullOrWhiteSpace(inputEmail))
        {
            throw new ArgumentException("Email is required.", nameof(inputEmail));
        }

        // FIX: select only the needed column instead of SELECT *.
        // NOTE: match the table and column names to /database/schema.sql.
        const string sql = "SELECT RegistrationId FROM Registrations WHERE Email = @Email";

        // FIX: 'using' guarantees the connection and command are closed and disposed,
        // even if an exception is thrown.
        using (var conn = new SqlConnection(_connectionString))
        using (var cmd = new SqlCommand(sql, conn))
        {
            // FIX: parameterized query. User input is sent as data, never concatenated into
            // the SQL text, so input like "' OR '1'='1" cannot change the query.
            cmd.Parameters.Add("@Email", SqlDbType.NVarChar, 254).Value = inputEmail.Trim();

            conn.Open();

            object? result = cmd.ExecuteScalar();

            // FIX: ExecuteScalar returns null when no row matches; calling .ToString()
            // directly would throw a NullReferenceException.
            return result?.ToString();
        }
    }
}