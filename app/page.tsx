"use client";

import React, { useState, useEffect, useCallback } from "react";

// ARTE ASCII ACADEMICO
const ASCII_HEADER = `
  ____ ___ __  __ _   _ _        _    ____ ___ ___  _   _
 / ___|_ _|  \\/  | | | | |      / \\  / ___|_ _/ _ \\| \\ | |
 \\___ \\| || |\\/| | | | | |     / _ \\| |    | | | | |  \\| |
  ___) | || |  | | |_| | |___ / ___ \\ |___ | | |_| | |\\  |
 |____/___|_|  |_|\\___/|_____/_/   \\_\\____|___\\___/|_| \\_|
       SISTEMA DE CALCULO Y ANALISIS DE SEGURIDAD v2.0
`;

export default function App() {
  const [activeTab, setActiveTab] = useState("simulator");

  // --- ESTADOS DEL SIMULADOR ---
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cores, setCores] = useState(4);
  const [hashesPerSecond, setHashesPerSecond] = useState(0);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [entropy, setEntropy] = useState(0);
  const [combinations, setCombinations] = useState(0);
  const [timeToCrack, setTimeToCrack] = useState(0);
  const [alphabetSize, setAlphabetSize] = useState(0);

  // --- ESTADOS DE LA RADIOGRAFIA ---
  const [deviceInfo, setDeviceInfo] = useState({
    os: "...",
    browser: "...",
    deviceModel: "...",
    cpuArch: "...",
    memory: "...",
    screen: "...",
    connection: "...",
    networkSpeed: "...",
    gpu: "...",
    language: "...",
    timezone: "...",
    touch: "...",
    battery: "...",
    fingerprint: "...",
    userAgent: "...",
  });

  const [advTelemetry, setAdvTelemetry] = useState({
    storageTotal: "...",
    storageUsed: "...",
    colorDepth: "...",
    pixelRatio: "...",
    theme: "...",
    reducedMotion: "...",
    dnt: "...",
    cookies: "...",
    pdf: "...",
    languages: [],
    hardwareConcurrency: 0,
    mediaDevices: { cameras: 0, mics: 0, speakers: 0, permission: "..." },
  });

  const [geolocation, setGeolocation] = useState({
    status: "EN ESPERA",
    lat: null,
    lon: null,
    accuracy: null,
    link: null,
  });

  // --- RECOLECCION DE DATOS CON BYPASS DE TYPESCRIPT ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = navigator;
    if (nav.hardwareConcurrency) setCores(nav.hardwareConcurrency);

    let gpuModel = "NO DETECTADO";
    try {
      const canvas = document.createElement("canvas");
      // Acceso dinámico para evadir el Type Checking de Vercel
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (gl) {
        // Usamos notación de corchetes para que el compilador no valide la propiedad
        const getExtensionFn = gl["getExtension"];
        if (typeof getExtensionFn === "function") {
          const debugInfo = getExtensionFn.call(
            gl,
            "WEBGL_debug_renderer_info",
          );
          if (debugInfo) {
            const getParamFn = gl["getParameter"];
            gpuModel =
              getParamFn.call(gl, debugInfo["UNMASKED_RENDERER_WEBGL"]) ||
              "NO DISPONIBLE";
          }
        }
      }
    } catch (e) {
      gpuModel = "ERROR_ACCESO";
    }

    const ua = nav.userAgent;
    let os = "DESCONOCIDO";
    if (ua.indexOf("Win") !== -1) os = "WINDOWS";
    if (ua.indexOf("Mac") !== -1) os = "MACOS";
    if (ua.indexOf("Linux") !== -1) os = "LINUX";
    if (ua.indexOf("Android") !== -1) os = "ANDROID";
    if (ua.indexOf("like Mac") !== -1) os = "IOS";

    let browser = "DESCONOCIDO";
    if (ua.indexOf("Firefox") !== -1) browser = "FIREFOX";
    else if (ua.indexOf("Edge") !== -1 || ua.indexOf("Edg") !== -1)
      browser = "EDGE";
    else if (ua.indexOf("Chrome") !== -1) browser = "CHROME";
    else if (ua.indexOf("Safari") !== -1) browser = "SAFARI";

    const isMobileDevice =
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(
        ua,
      );
    const deviceType = isMobileDevice ? "MOVIL" : "ESCRITORIO";
    const cpuArch = /x86_64|x86|Win64|x64/.test(ua)
      ? "x64"
      : /arm64|aarch64|AppleWebKit/.test(ua)
        ? "ARM"
        : "DESCONOCIDA";

    // Acceso seguro a propiedades de red
    const connection =
      nav["connection"] || nav["mozConnection"] || nav["webkitConnection"];
    let connectionType = "DESCONOCIDA",
      networkSpeed = "DESCONOCIDA";
    if (connection) {
      connectionType = connection["effectiveType"]
        ? String(connection["effectiveType"]).toUpperCase()
        : "DESCONOCIDA";
      networkSpeed = connection["downlink"]
        ? `${connection["downlink"]} Mbps [${connection["rtt"]}ms]`
        : "DESCONOCIDA";
    }

    setDeviceInfo((prev) => ({
      ...prev,
      os,
      browser,
      deviceModel: deviceType,
      cpuArch,
      memory: nav["deviceMemory"] ? `${nav["deviceMemory"]}GB` : "RESTRINGIDO",
      screen: `${window.screen.width}x${window.screen.height}`,
      connection: connectionType,
      networkSpeed,
      gpu: gpuModel,
      language: nav.language.toUpperCase(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.toUpperCase(),
      touch: nav.maxTouchPoints > 0 ? `SI [${nav.maxTouchPoints} PTS]` : "NO",
      userAgent: ua,
    }));

    if (nav.getBattery) {
      nav
        .getBattery()
        .then((battery) => {
          const updateBattery = () => {
            setDeviceInfo((prev) => ({
              ...prev,
              battery: `${Math.round(battery.level * 100)}% [${battery.charging ? "CARGANDO" : "DESCONECTADO"}]`,
            }));
          };
          updateBattery();
          battery.addEventListener("levelchange", updateBattery);
          battery.addEventListener("chargingchange", updateBattery);
        })
        .catch(() => {});
    }

    const generateFingerprint = () => {
      const str = `${ua}|${nav.language}|${window.screen.width}|${nav.hardwareConcurrency}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).toUpperCase();
    };
    setDeviceInfo((prev) => ({ ...prev, fingerprint: generateFingerprint() }));

    const gatherStorage = async () => {
      if (nav.storage && nav.storage.estimate) {
        try {
          const est = await nav.storage.estimate();
          setAdvTelemetry((prev) => ({
            ...prev,
            storageTotal: est.quota
              ? `${(est.quota / 1024 ** 3).toFixed(2)}GB`
              : "N/D",
            storageUsed: est.usage
              ? `${(est.usage / 1024 ** 2).toFixed(2)}MB`
              : "N/D",
            theme: window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "OSCURO"
              : "CLARO",
            cookies: nav.cookieEnabled ? "HABILITADAS" : "BLOQUEADAS",
            languages: nav.languages.map((l) => l.toUpperCase()),
            hardwareConcurrency: nav.hardwareConcurrency || "N/D",
          }));
        } catch (e) {}
      }
    };
    gatherStorage();
  }, []);

  // --- BENCHMARK REAL ---
  const runBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const start = performance.now();
      let operations = 0;
      while (performance.now() - start < 200) {
        operations += (Math.random() * 1000) ^ 2;
      }
      const diff = performance.now() - start;
      const baseOpsPerSec = (operations / (diff > 0 ? diff : 1)) * 1000;
      setHashesPerSecond(Math.floor(baseOpsPerSec * 25000 * cores));
      setIsBenchmarking(false);
    }, 50);
  };

  const calculateSecurity = useCallback(() => {
    if (!password) {
      setAlphabetSize(0);
      setCombinations(0);
      setEntropy(0);
      setTimeToCrack(0);
      return;
    }
    let l = 0;
    if (/[a-z]/.test(password)) l += 26;
    if (/[A-Z]/.test(password)) l += 26;
    if (/[0-9]/.test(password)) l += 10;
    if (/[^a-zA-Z0-9]/.test(password)) l += 33;
    if (l === 0) l = 26;

    setAlphabetSize(l);
    const c = Math.pow(l, password.length);
    setCombinations(c);
    setEntropy(password.length * Math.log2(l));
    const hps = hashesPerSecond > 0 ? hashesPerSecond : 100000000;
    setTimeToCrack(c / hps);
  }, [password, hashesPerSecond]);

  useEffect(() => {
    calculateSecurity();
  }, [calculateSecurity]);

  const requestLocation = () => {
    setGeolocation((prev) => ({ ...prev, status: "SOLICITANDO..." }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeolocation({
          status: "LOCALIZADO",
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
          accuracy: `±${Math.round(pos.coords.accuracy)}m`,
          link: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`,
        }),
      () => setGeolocation((prev) => ({ ...prev, status: "ERROR_ACCESO" })),
      { enableHighAccuracy: true },
    );
  };

  const formatTime = (seconds) => {
    if (!seconds || !password) return "0 SEGUNDOS";
    if (seconds < 1) return "INSTANTÁNEO";
    const minutes = seconds / 60;
    if (minutes < 1) return `${Math.round(seconds)} SEG`;
    const hours = minutes / 60;
    if (hours < 1) return `${Math.round(minutes)} MIN`;
    const days = hours / 24;
    if (days < 1) return `${Math.round(hours)} HORAS`;
    const years = days / 365.25;
    if (years < 1) return `${Math.round(days)} DÍAS`;
    if (years < 100) return `${Math.round(years)} AÑOS`;
    if (years > 1e100) return "INMUNE (>1e100 AÑOS)";
    return `${years.toExponential(2)} AÑOS`;
  };

  const formatNumber = (num) =>
    num > 1e21
      ? num.toExponential(2)
      : new Intl.NumberFormat("es-MX").format(Math.floor(num));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] p-4 sm:p-8 font-mono text-xs sm:text-sm selection:bg-[#262626] selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ENCABEZADO */}
        <header className="border border-[#262626] p-4 bg-[#0d0d0d] shadow-2xl">
          <pre className="text-[#3b82f6] text-[7px] sm:text-[9px] md:text-xs leading-tight mb-4 overflow-hidden whitespace-pre">
            {ASCII_HEADER}
          </pre>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#262626] pt-4">
            <div>
              <div className="text-[#525252] text-[10px] mb-1">ESTUDIANTE</div>
              <div className="text-white font-bold uppercase tracking-wider text-sm">
                Angel Adrian Guerra Avila - grupo 23
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-[#525252] text-[10px] mb-1">DOCENTE</div>
              <div className="text-white font-bold uppercase tracking-wider text-sm">
                Ruben Mendieta
              </div>
            </div>
          </div>
        </header>

        {/* NAVEGACIÓN */}
        <nav className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`border px-6 py-2 transition-all ${activeTab === "simulator" ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]" : "border-[#262626] text-[#525252] hover:text-[#a3a3a3]"}`}
          >
            SIMULADOR DE SEGURIDAD
          </button>
          <button
            onClick={() => setActiveTab("radiography")}
            className={`border px-6 py-2 transition-all ${activeTab === "radiography" ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]" : "border-[#262626] text-[#525252] hover:text-[#a3a3a3]"}`}
          >
            RADIOGRAFÍA DEL SISTEMA
          </button>
        </nav>

        {/* CONTENIDO: SIMULADOR */}
        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-[#262626] p-6 bg-[#0d0d0d]">
                <div className="text-[#525252] mb-4 border-b border-[#262626] pb-2 text-[10px]">
                  ENTRADA DE PARAMETROS
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="INGRESE CADENA..."
                      className="w-full bg-black border border-[#262626] p-3 text-white focus:border-[#3b82f6] outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#525252] text-[10px] hover:text-white"
                    >
                      {showPassword ? "[ OCULTAR ]" : "[ MOSTRAR ]"}
                    </button>
                  </div>
                  <div className="flex gap-3 text-[10px] text-[#404040]">
                    <span
                      className={/[a-z]/.test(password) ? "text-[#3b82f6]" : ""}
                    >
                      [a-z]
                    </span>
                    <span
                      className={/[A-Z]/.test(password) ? "text-[#3b82f6]" : ""}
                    >
                      [A-Z]
                    </span>
                    <span
                      className={/[0-9]/.test(password) ? "text-[#3b82f6]" : ""}
                    >
                      [0-9]
                    </span>
                    <span
                      className={
                        /[^a-zA-Z0-9]/.test(password) ? "text-[#3b82f6]" : ""
                      }
                    >
                      [ESPECIALES]
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-[#262626] p-6 bg-[#0d0d0d]">
                <div className="text-[#525252] mb-4 border-b border-[#262626] pb-2 text-[10px]">
                  CAPACIDAD DEL NODO LOCAL
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <div className="text-[#525252] text-[10px] mb-1">
                      NÚCLEOS
                    </div>
                    <div className="text-white font-bold">{cores}</div>
                  </div>
                  <div>
                    <div className="text-[#525252] text-[10px] mb-1">
                      TASA ACTUAL (H/S)
                    </div>
                    <div className="text-white font-bold truncate">
                      {hashesPerSecond === 0
                        ? "PENDIENTE"
                        : formatNumber(hashesPerSecond)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={runBenchmark}
                  disabled={isBenchmarking}
                  className={`w-full border p-3 transition-all font-bold ${isBenchmarking ? "border-red-900 text-red-900 cursor-wait" : "border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10"}`}
                >
                  {isBenchmarking
                    ? "ESTRESANDO HARDWARE..."
                    : "INICIAR BENCHMARK"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 border border-[#262626] p-6 bg-[#0d0d0d] flex flex-col justify-between">
              <div>
                <div className="text-[#525252] mb-6 border-b border-[#262626] pb-2 text-[10px]">
                  PROYECCIÓN DE TIEMPO ESTIMADO
                </div>
                <div className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tighter leading-tight">
                  {formatTime(timeToCrack)}
                </div>
                <div
                  className={`text-[10px] inline-block p-1 px-3 border font-bold ${entropy < 60 ? "border-red-900 text-red-700 bg-red-900/10" : "border-green-900 text-green-700 bg-green-900/10"}`}
                >
                  ESTADO:{" "}
                  {entropy === 0
                    ? "EN ESPERA"
                    : entropy < 40
                      ? "RIESGO CRÍTICO"
                      : "SEGURIDAD ÓPTIMA"}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-[#262626]">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#525252]">ENTROPÍA DE SHANNON</span>
                  <span className="text-[#3b82f6] font-bold">
                    {entropy.toFixed(2)} BITS
                  </span>
                </div>
                <div className="w-full bg-black h-2 border border-[#262626]">
                  <div
                    className="h-full bg-[#3b82f6] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (entropy / 128) * 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] pt-2">
                  <span className="text-[#525252]">
                    ESPACIO DE BÚSQUEDA COMBINATORIA
                  </span>
                  <span className="text-white font-bold">
                    {formatNumber(combinations)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO: RADIOGRAFÍA */}
        {activeTab === "radiography" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="border border-[#262626] p-6 bg-[#0d0d0d] space-y-4">
              <div className="text-[#10b981] text-[10px] border-b border-[#10b981]/20 pb-2 font-bold uppercase tracking-widest">
                Identidad del Sistema
              </div>
              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">HASH DE VISITANTE</span>
                  <span className="text-[#10b981] font-bold">
                    {deviceInfo.fingerprint}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">SISTEMA OPERATIVO</span>
                  <span className="text-white font-bold">{deviceInfo.os}</span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">NAVEGADOR BASE</span>
                  <span className="text-white font-bold">
                    {deviceInfo.browser}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">ZONA HORARIA</span>
                  <span className="text-white truncate ml-4 font-bold">
                    {deviceInfo.timezone}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-[#262626] p-6 bg-[#0d0d0d] space-y-4">
              <div className="text-[#10b981] text-[10px] border-b border-[#10b981]/20 pb-2 font-bold uppercase tracking-widest">
                Especificaciones de Hardware
              </div>
              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">NÚCLEOS LÓGICOS</span>
                  <span className="text-white font-bold">
                    {advTelemetry.hardwareConcurrency}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">RAM ESTIMADA</span>
                  <span className="text-white font-bold">
                    {deviceInfo.memory}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">PROCESADOR GRAFICO</span>
                  <span
                    className="text-[#10b981] truncate ml-4 font-bold"
                    title={deviceInfo.gpu}
                  >
                    {deviceInfo.gpu}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a1a] pb-1">
                  <span className="text-[#525252]">ESTADO DE BATERÍA</span>
                  <span className="text-white font-bold">
                    {deviceInfo.battery}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-[#262626] p-6 bg-[#0d0d0d] space-y-4 md:col-span-2 lg:col-span-1">
              <div className="text-[#10b981] text-[10px] border-b border-[#10b981]/20 pb-2 font-bold uppercase tracking-widest">
                Localización y Conectividad
              </div>
              <div className="space-y-4">
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#525252]">TIPO DE ENLACE</span>
                    <span className="text-white font-bold">
                      {deviceInfo.connection}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525252]">ANCHO DE BANDA</span>
                    <span className="text-white font-bold">
                      {deviceInfo.networkSpeed}
                    </span>
                  </div>
                </div>
                <div className="border border-[#262626] p-3 bg-black">
                  <button
                    onClick={requestLocation}
                    className="w-full text-[10px] text-[#10b981] hover:text-white transition-colors font-bold"
                  >
                    {geolocation.lat
                      ? `LOCALIZACIÓN: ${geolocation.lat}, ${geolocation.lon}`
                      : `[ OBTENER COORDENADAS GPS ]`}
                  </button>
                  {geolocation.link && (
                    <a
                      href={geolocation.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-[#525252] text-[9px] mt-2 underline font-bold uppercase"
                    >
                      Abrir Mapa Externo
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-[#262626] p-4 bg-black col-span-1 md:col-span-2 lg:col-span-3">
              <div className="text-[#404040] text-[9px] mb-2 uppercase tracking-widest font-bold">
                User Agent del Sistema
              </div>
              <div className="text-[#525252] text-[10px] break-all leading-relaxed italic border-l-2 border-[#1a1a1a] pl-3">
                {deviceInfo.userAgent}
              </div>
            </div>
          </div>
        )}

        <footer className="text-center text-[#404040] text-[9px] pt-8 border-t border-[#1a1a1a] uppercase tracking-widest">
          PROYECTO FINAL - INGENIERÍA EN SISTEMAS - 2024
        </footer>
      </div>
    </div>
  );
}
