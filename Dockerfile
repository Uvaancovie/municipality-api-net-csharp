
# Stage 1 – Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MunicipalApi.csproj", "./"]
RUN dotnet restore "MunicipalApi.csproj"
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 2 – Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Render uses PORT environment variable, but we default to 5268
ENV ASPNETCORE_URLS=http://+:${PORT:-5268}
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE ${PORT:-5268}
ENTRYPOINT ["dotnet","MunicipalApi.dll"]
