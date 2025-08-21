using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IDbConnection>(sp => 
    new SqliteConnection("Data Source=tinyhind.db"));

// Get the hosting mode from an environment variable
var hostingMode = Environment.GetEnvironmentVariable("TINYHIND_HOSTING_MODE");

if (hostingMode != "Unified")
{
    // If NOT in Unified mode, enable CORS for the separate dev server
    Console.WriteLine("--> Running in Separate Mode: CORS enabled.");
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAnything", policy =>
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        });
    });
}

var app = builder.Build();

if (hostingMode == "Unified")
{
    // If in Unified mode, serve the static frontend files
    Console.WriteLine("--> Running in Unified Mode: Serving static frontend files.");
    // This tells the server to look for files in a 'wwwroot' folder
    app.UseDefaultFiles(); // Serves index.html for root requests
    app.UseStaticFiles(); // Serves js, css, etc.
}
else
{
    app.UseCors("AllowAnything");
}

app.MapRuneEndpoints();
app.MapCallEndpoints();

if (hostingMode == "Unified")
{
    // In Unified mode, any unhandled request falls back to the index page
    app.MapFallbackToFile("index.html");
}

app.Run();










// using System.Data;
// using Microsoft.Data.Sqlite;
// using Microsoft.Extensions.FileProviders;

// var builder = WebApplication.CreateBuilder(args);

// builder.Services.AddScoped<IDbConnection>(sp => 
//     new SqliteConnection("Data Source=tinyhind.db"));



// //Uncomment to disable cors if running unified
// // builder.Services.AddCors(options =>
// // {
// //     options.AddPolicy("AllowAnything", policy =>
// //     {
// //         policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
// //     });
// // });



// var app = builder.Build();

// //Uncomment to disable cors if running unified
// // app.UseCors("AllowAnything");

// app.MapRuneEndpoints();
// app.MapCallEndpoints();


// //Are you runnin your backend and frontend together? 
// //Uncomment this to have the backend become a webserver
// //For your frontend! 
// var staticFileOptions = new StaticFileOptions
// {
//     // Tell the server to look in ../frontend/serve for the files
//     FileProvider = new PhysicalFileProvider(
//         Path.Combine(app.Environment.ContentRootPath, "..", "frontend", "serve"))
// };
// app.UseStaticFiles(staticFileOptions);

// //For any request that doesn't match an API endpoint
// app.MapFallbackToFile("index.html", staticFileOptions);

// app.Run();