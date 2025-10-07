// Test específico para encontrar el error exacto
console.log("=== DIAGNÓSTICO DEL SERVIDOR ===");

try {
  console.log("1. Cargando dotenv...");
  require("dotenv").config();
  console.log("✓ Variables de entorno cargadas");
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

  console.log("2. Cargando express...");
  const express = require("express");
  const app = express();
  console.log("✓ Express cargado");

  console.log("3. Cargando database...");
  const { setupDatabase } = require("./dist/utils/database");
  console.log("✓ Database module cargado");

  console.log("4. Configurando base de datos...");
  setupDatabase()
    .then(() => {
      console.log("✓ Base de datos configurada correctamente");
      
      console.log("5. Configurando servidor básico...");
      app.get('/test', (req, res) => {
        res.json({ message: 'Test OK' });
      });

      const PORT = process.env.PORT || 3000;
      const server = app.listen(PORT, () => {
        console.log(`✓ Servidor de prueba funcionando en puerto ${PORT}`);
        
        // Test rápido
        setTimeout(() => {
          console.log("6. Cerrando servidor...");
          server.close(() => {
            console.log("✓ Test completado exitosamente");
            process.exit(0);
          });
        }, 2000);
      });
    })
    .catch((error) => {
      console.error("❌ Error en setupDatabase:", error.message);
      console.error("Stack:", error.stack);
      process.exit(1);
    });

} catch (error) {
  console.error("❌ Error general:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}