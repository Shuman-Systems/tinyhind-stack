// In TinyCallEndpoints.cs
using System.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Dapper;

public static class TinyCallEndpoints
{
    public static void MapCallEndpoints(this IEndpointRouteBuilder app)
    {
        var callGroup = app.MapGroup("/call");



        // MODIFIED: This now returns the ID of the new record.
        callGroup.MapPost("/{tenantId:guid}/{tableName}",
            async (Guid tenantId, string tableName, JsonObject newRecord, IDbConnection db) =>
        {
            var safeTableName = $"{tenantId}_{tableName.Replace(";", "")}";
            var columns = newRecord.Select(kvp => kvp.Key);
            var parameters = columns.Select(col => $"@{col}");

            // Appended "returning Id" to the SQL statement (for SQLite)
            var sql = $"INSERT INTO `{safeTableName}` ({string.Join(", ", columns)}) VALUES ({string.Join(", ", parameters)}) RETURNING Id;";

            var dynamicParams = new DynamicParameters();
            foreach (var field in newRecord)
            {
                var value = field.Value;
                object? paramValue = value?.GetValue<JsonElement>().ValueKind switch
                {
                    JsonValueKind.String => value.GetValue<string>(),
                    JsonValueKind.Number => value.GetValue<decimal>(),
                    JsonValueKind.True or JsonValueKind.False => value.GetValue<bool>(),
                    _ => null
                };
                dynamicParams.Add(field.Key, paramValue);
            }

            Console.WriteLine($"[CALL] Executing SQL: {sql}");
            // Use ExecuteScalarAsync to get the single returned ID value.
            var newId = await db.ExecuteScalarAsync<long>(sql, dynamicParams);

            return Results.Created($"/{tableName}/{newId}", new { id = newId });
        });




        // NEW: Add an endpoint to get a single record by its ID.
        callGroup.MapGet("/{tenantId:guid}/{tableName}/{id:long}",
            async (Guid tenantId, string tableName, long id, IDbConnection db) =>
        {
            var safeTableName = $"{tenantId}_{tableName.Replace(";", "")}";
            var sql = $"SELECT * FROM `{safeTableName}` WHERE Id = @Id;";

            Console.WriteLine($"[CALL] Executing SQL: {sql}");
            var record = await db.QuerySingleOrDefaultAsync(sql, new { Id = id });

            return record is not null ? Results.Ok(record) : Results.NotFound();
        });





        callGroup.MapPost("/{tenantId:guid}/query",
        async (Guid tenantId, JsonObject query, IDbConnection db) =>
        {
            var parameters = new DynamicParameters();
            var fromTable = query["from"]!.GetValue<string>();
            var safeTableName = $"{tenantId}_{fromTable.Replace(";", "")}";

            // --- Build Select Clause ---
            var selectClause = query.ContainsKey("select")
                ? string.Join(", ", query["select"]!.AsArray().Select(n => $"`{n!.ToString()}`"))
                : "*";

            var sqlBuilder = new StringBuilder($"SELECT {selectClause} FROM `{safeTableName}`");

            // --- Build Secure WHERE Clause ---
            if (query.ContainsKey("where"))
            {
                var whereConditions = new List<string>();
                var whereClause = query["where"]!.AsObject();
                int paramIndex = 0;

                foreach (var condition in whereClause)
                {
                    var field = condition.Key;
                    var opObject = condition.Value!.AsObject();
                    var op = opObject.First().Key;
                    var value = opObject.First().Value;

                    var paramName = $"p{paramIndex++}";
                    var sqlOp = op.ToLower() switch
                    {
                        "gt" => ">",
                        "lt" => "<",
                        "gte" => ">=",
                        "lte" => "<=",
                        "neq" => "!=",
                        "like" => "LIKE",
                        _ => "=" // Default to equals
                    };

                    whereConditions.Add($"`{field}` {sqlOp} @{paramName}");

                    // Add the value safely as a parameter to prevent SQL injection
                    parameters.Add(paramName, value!.ToString());
                }
                sqlBuilder.Append($" WHERE {string.Join(" AND ", whereConditions)}");
            }

            // --- Build Order By, Limit, Offset (can be added here later) ---

            var finalSql = sqlBuilder.ToString();
            Console.WriteLine($"[CALL] Executing Query: {finalSql}");

            var results = await db.QueryAsync(finalSql, parameters);
            return Results.Ok(results);
        });


        callGroup.MapPut("/{tenantId:guid}/{tableName}/{id:long}",
        async (Guid tenantId, string tableName, long id, JsonObject updatedRecord, IDbConnection db) =>
        {
            var safeTableName = $"{tenantId}_{tableName.Replace(";", "")}";

            // Build the "SET" part of the SQL statement
            var setClauses = updatedRecord.Select(kvp => $"`{kvp.Key}` = @{kvp.Key}");

            var sql = $"UPDATE `{safeTableName}` SET {string.Join(", ", setClauses)} WHERE Id = @Id;";

            // Create Dapper parameters, including the Id from the route
            var dynamicParams = new DynamicParameters();
            dynamicParams.Add("Id", id);
            foreach (var field in updatedRecord)
            {
                var value = field.Value;
                object? paramValue = value?.GetValue<JsonElement>().ValueKind switch
                {
                    JsonValueKind.String => value.GetValue<string>(),
                    JsonValueKind.Number => value.GetValue<decimal>(),
                    JsonValueKind.True or JsonValueKind.False => value.GetValue<bool>(),
                    _ => null
                };
                dynamicParams.Add(field.Key, paramValue);
            }

            Console.WriteLine($"[CALL] Executing SQL: {sql}");
            var affectedRows = await db.ExecuteAsync(sql, dynamicParams);

            // If ExecuteAsync returns 0, no rows were updated (likely a non-existent ID).
            return affectedRows > 0 ? Results.Ok("Record updated successfully.") : Results.NotFound();
        });
        


        // NEW: Add an endpoint to delete a record by its ID.
        callGroup.MapDelete("/{tenantId:guid}/{tableName}/{id:long}",
        async (Guid tenantId, string tableName, long id, IDbConnection db) =>
        {
            var safeTableName = $"{tenantId}_{tableName.Replace(";", "")}";
            var sql = $"DELETE FROM `{safeTableName}` WHERE Id = @Id;";

            Console.WriteLine($"[CALL] Executing SQL: {sql}");
            var affectedRows = await db.ExecuteAsync(sql, new { Id = id });

            return affectedRows > 0 ? Results.Ok("Record deleted successfully.") : Results.NotFound();
        });



    }
}