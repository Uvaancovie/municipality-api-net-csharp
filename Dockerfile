# Multi-stage Dockerfile for ASP.NET Core 8 backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything and restore/build inside the SDK image
COPY . ./
RUN dotnet restore
RUN dotnet build -c Release -o /app/build

# Run EF migrations in the build stage to create the SQLite file
# This will create municipal.db in the repository root inside the image
RUN dotnet tool restore || true
RUN dotnet ef database update || true

RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published app
COPY --from=build /app/publish ./

# If migrations created an SQLite database file, copy it into the runtime image
COPY --from=build /src/municipal.db ./municipal.db

ENV ASPNETCORE_URLS=http://+:5268
EXPOSE 5268

ENTRYPOINT ["dotnet", "MunicipalApi.dll"]
