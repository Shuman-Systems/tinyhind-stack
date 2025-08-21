// In Program.cs
using System.Data;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

// --- Add services ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAnything", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Add the SQLite connection as a service that any endpoint can use.
// It will connect to a file named "tinyhind.db" in the project folder.
builder.Services.AddScoped<IDbConnection>(sp => 
    new SqliteConnection("Data Source=tinyhind.db"));

var app = builder.Build();

// --- Configure middleware ---
app.UseCors("AllowAnything");

app.MapGet("/", () => "Hello World!");

// --- Map endpoints ---
app.MapRuneEndpoints();
app.MapCallEndpoints();

app.Run();