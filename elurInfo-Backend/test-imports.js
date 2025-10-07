console.log("Iniciando test de imports...");

try {
  console.log("1. Cargando express...");
  const express = require("express");
  console.log("✓ Express cargado");

  console.log("2. Cargando dotenv...");
  require("dotenv").config();
  console.log("✓ Dotenv cargado");

  console.log("3. Cargando utils/database...");
  const { setupDatabase } = require("./dist/utils/database");
  console.log("✓ Database utils cargado");

  console.log("4. Cargando utils/logger...");
  const { logger } = require("./dist/utils/logger");
  console.log("✓ Logger cargado");

  console.log("5. Cargando routes/health...");
  const healthRoute = require("./dist/routes/health");
  console.log("✓ Health route cargado");

  console.log("6. Cargando routes/snow-science...");
  const snowScienceRoute = require("./dist/routes/snow-science");
  console.log("✓ Snow science route cargado");

  console.log("7. Cargando scheduler...");
  const { startScheduler } = require("./dist/utils/scheduler");
  console.log("✓ Scheduler cargado");

  console.log("8. Todos los imports cargados correctamente!");

} catch (error) {
  console.error("❌ Error en import:", error.message);
  console.error("Stack:", error.stack);
}