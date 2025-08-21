using System.Data;
using Microsoft.Data.Sqlite;

// 1. Read the hosting mode from the environment FIRST.
var hostingMode = Environment.GetEnvironmentVariable("TINYHIND_HOSTING_MODE");

// 2. Configure the builder options BEFORE creating the builder.
var builderOptions = new WebApplicationOptions
{
    Args = args,
    // If we are in Unified mode, tell the builder where the web root is.
    // If not, this remains null, and the builder won't look for a wwwroot folder.
    WebRootPath = hostingMode == "Unified" ? "wwwroot" : null
};

var builder = WebApplication.CreateBuilder(builderOptions);

// --- Add services ---
builder.Services.AddScoped<IDbConnection>(sp => 
    new SqliteConnection("Data Source=tinyhind.db"));

if (hostingMode != "Unified")
{
    // If NOT in Unified mode, enable CORS.
    Console.WriteLine("--> Running in Separate Mode: CORS DISABLED!.");
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAnything", policy =>
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        });
    });
}

var app = builder.Build();

// --- Configure Middleware & Endpoints ---
if (hostingMode == "Unified")
{
    Console.WriteLine("--> Running in Unified Mode: Serving static frontend files.");
    app.UseDefaultFiles();
    app.UseStaticFiles();
}
else
{
    app.UseCors("AllowAnything");
}

app.MapRuneEndpoints();
app.MapCallEndpoints();

if (hostingMode == "Unified")
{
    app.MapFallbackToFile("index.html");
}

app.Run();