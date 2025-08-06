import { useState } from 'react';

/**
 * Aplicación Frontend - Gestión de Clínica Distribuida
 * 
 * Esta aplicación React proporciona una interfaz para probar:
 * - Fragmentación de datos (horizontal/vertical)
 * - Replicación de datos (b      <div className={`p-4 rounded-md border ${
        result.success 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <h4 className="font-medium mb-2">
          {result.success ? 'Datos de Respuesta:' : 'Información:'}
        </h4>
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
          {result.success 
            ? JSON.stringify(result.data, null, 2)
            : (result.error || result.message)
          }</pre>unidireccional)
 * 
 * Backend URL: http://localhost:3001
 * Endpoints disponibles:
 * - POST /fragment - Para fragmentación de datos
 * - POST /replicate - Para replicación de datos
 */

// Componente para formulario de fragmentación
const FragmentForm = ({ onResult }) => {
  const [type, setType] = useState('horizontal');
  const [params, setParams] = useState('{"condition": "id > 100", "table": "pacientes"}');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedParams = JSON.parse(params);
      
      // TODO: Conectar con el backend
      // const response = await fetch('http://localhost:3001/fragment', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     type: type,
      //     ...parsedParams
      //   })
      // });
      // const result = await response.json();

      // Placeholder para mostrar estructura esperada
      onResult({
        operation: 'Fragmentación',
        type: type,
        success: false,
        message: 'Backend no conectado - Por favor implementar la llamada a la API',
        timestamp: new Date().toLocaleString()
      });

    } catch (error) {
      onResult({
        operation: 'Fragmentación',
        success: false,
        error: 'JSON inválido: ' + error.message,
        timestamp: new Date().toLocaleString()
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">🔍 Fragmentación de Datos</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Fragmentación
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parámetros (JSON)
          </label>
          <textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder='{"condition": "campo = valor", "table": "nombre_tabla"}'
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Fragmentación'}
        </button>
      </form>
    </div>
  );
};

// Componente para formulario de replicación
const ReplicationForm = ({ onResult }) => {
  const [strategy, setStrategy] = useState('bidirectional');
  const [params, setParams] = useState('{"nodes": ["quito", "guayaquil"]}');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedParams = JSON.parse(params);
      
      // TODO: Conectar con el backend
      // const response = await fetch('http://localhost:3001/replicate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     strategy: strategy,
      //     ...parsedParams
      //   })
      // });
      // const result = await response.json();

      // Placeholder para mostrar estructura esperada
      onResult({
        operation: 'Replicación',
        strategy: strategy,
        success: false,
        message: 'Backend no conectado - Por favor implementar la llamada a la API',
        timestamp: new Date().toLocaleString()
      });

    } catch (error) {
      onResult({
        operation: 'Replicación',
        success: false,
        error: 'JSON inválido: ' + error.message,
        timestamp: new Date().toLocaleString()
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold text-green-800 mb-4">🔄 Replicación de Datos</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estrategia de Replicación
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          >
            <option value="bidirectional">Bidireccional</option>
            <option value="unidirectional">Unidireccional</option>
            <option value="master-slave">Maestro-Esclavo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parámetros (JSON)
          </label>
          <textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 font-mono text-sm"
            placeholder='{"nodes": ["quito", "guayaquil"], "tables": ["pacientes"]}'
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Replicación'}
        </button>
      </form>
    </div>
  );
};

// Componente para mostrar resultados
const ResultPanel = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-xl font-semibold text-gray-600 mb-3">📊 Resultados</h3>
        <p className="text-gray-500 text-center py-8">
          Los resultados aparecerán aquí después de ejecutar una operación...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          📊 Resultado: {result.operation}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          result.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {result.success ? '✅ Exitoso' : '❌ Error'}
        </span>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <p><strong>Timestamp:</strong> {result.timestamp}</p>
        {result.type && <p><strong>Tipo:</strong> {result.type}</p>}
        {result.strategy && <p><strong>Estrategia:</strong> {result.strategy}</p>}
      </div>

      <div className={`p-4 rounded-md border ${
        result.success 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <h4 className="font-medium mb-2">
          {result.success ? 'Datos de Respuesta:' : 'Error:'}
        </h4>
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
          {result.success 
            ? JSON.stringify(result.data, null, 2)
            : result.error
          }
        </pre>
      </div>
    </div>
  );
};

// Componente principal de la aplicación
function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🏥 Gestión de Clínica Distribuida
          </h1>
          <p className="text-gray-600 mt-2">
            Frontend React para operaciones de fragmentación y replicación
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Panel */}
        <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h2 className="text-lg font-semibold text-orange-800 mb-2">
            ⚠️ Estado: Backend No Conectado
          </h2>
          <p className="text-sm text-orange-700">
            Esta interfaz está lista para conectar con el backend. Por favor, descomenta las llamadas API en los componentes FormFragment y ReplicationForm, y asegúrate de que el servidor esté ejecutándose en http://localhost:3001
          </p>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FragmentForm onResult={setResult} />
          <ReplicationForm onResult={setResult} />
        </div>

        {/* Results Panel */}
        <ResultPanel result={result} />

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📋 Instrucciones para Conexión con Backend
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>1. Iniciar Backend:</strong> Asegúrate de que tu servidor Node.js esté ejecutándose en http://localhost:3001</p>
            <p><strong>2. Descomenta API Calls:</strong> En el código, descomenta las secciones de fetch() en ambos formularios</p>
            <p><strong>3. Fragmentación:</strong> POST /fragment con tipo y parámetros JSON</p>
            <p><strong>4. Replicación:</strong> POST /replicate con estrategia y configuración de nodos</p>
            <p><strong>5. Resultados:</strong> Las respuestas del servidor aparecerán en el panel inferior</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
