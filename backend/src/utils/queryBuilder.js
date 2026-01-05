import { query } from '../config/database.js';

/**
 * ========================================
 * QUERY BUILDER - Sistema de Filtros Universal
 * ========================================
 * Evita código duplicado en todos los endpoints de listado
 * Uso: const filters = buildQueryFilters(req.query, config)
 */

/**
 * Construir filtros SQL a partir de query params
 * @param {Object} queryParams - req.query del request
 * @param {Object} config - Configuración de filtros permitidos
 * @returns {Object} Objeto con whereClause, params, limit, offset, etc.
 */
export function buildQueryFilters(queryParams, config = {}) {
  const {
    searchFields = [],      // ['nombre', 'email'] - Campos para búsqueda general (OR)
    filterFields = [],      // ['ciudad', 'genero'] - Filtros con LIKE parcial
    exactFields = [],       // ['id', 'estado'] - Filtros exactos (=)
    booleanFields = [],     // ['activo', 'destacado'] - Campos booleanos (0/1)
    dateFields = [],        // ['created_at', 'fecha_evento'] - Campos de fecha
    defaultOrderBy = 'id',  // Campo de orden por defecto
    defaultOrderDir = 'DESC',
    maxLimit = 100,
    tableAlias = ''         // Alias de tabla (ej: 'u.' para users)
  } = config;

  const {
    search,           // Búsqueda general (OR entre searchFields)
    page = 1,
    limit = 20,
    orderBy,
    orderDir,
    dateFrom,         // Fecha desde
    dateTo,           // Fecha hasta
    ...filters        // Resto de filtros específicos
  } = queryParams;

  // ========================================
  // 1. VALIDAR PAGINACIÓN
  // ========================================
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // ========================================
  // 2. CONSTRUIR CONDICIONES WHERE
  // ========================================
  const conditions = [];
  const params = [];

  // 2.1 BÚSQUEDA GENERAL (OR entre múltiples campos)
  if (search && search.trim() && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => `${field} LIKE ?`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
    const searchPattern = `%${search.trim()}%`;
    searchFields.forEach(() => params.push(searchPattern));
  }

  // 2.2 FILTROS ESPECÍFICOS CON LIKE (para textos parciales)
  filterFields.forEach(field => {
    const filterValue = filters[field] || filters[field.replace(tableAlias, '')];
    if (filterValue !== undefined && filterValue !== '') {
      conditions.push(`${field} LIKE ?`);
      params.push(`%${filterValue}%`);
    }
  });

  // 2.3 FILTROS EXACTOS (para IDs, estados, enums)
  exactFields.forEach(field => {
    const filterValue = filters[field] || filters[field.replace(tableAlias, '')];
    if (filterValue !== undefined && filterValue !== '') {
      conditions.push(`${field} = ?`);
      params.push(filterValue);
    }
  });

  // 2.4 FILTROS BOOLEANOS (convertir string/number a 0/1)
  booleanFields.forEach(field => {
    const filterValue = filters[field] || filters[field.replace(tableAlias, '')];
    if (filterValue !== undefined) {
      const boolValue = filterValue === 'true' || filterValue === true || filterValue === 1 || filterValue === '1';
      conditions.push(`${field} = ?`);
      params.push(boolValue ? 1 : 0);
    }
  });

  // 2.5 FILTROS DE FECHA (rango)
  if (dateFields.length > 0) {
    const mainDateField = dateFields[0]; // Por defecto usa el primer campo
    if (dateFrom) {
      conditions.push(`DATE(${mainDateField}) >= ?`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`DATE(${mainDateField}) <= ?`);
      params.push(dateTo);
    }
  }

  // ========================================
  // 3. WHERE CLAUSE
  // ========================================
  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ') 
    : '';

  // ========================================
  // 4. ORDER BY (validar para evitar SQL injection)
  // ========================================
  const validOrderFields = [
    defaultOrderBy, 
    ...searchFields, 
    ...filterFields, 
    ...exactFields,
    ...dateFields,
    'id', 'created_at', 'updated_at' // Siempre permitir estos
  ].map(f => f.replace(tableAlias, '')); // Permitir con y sin alias

  // Limpiar orderBy de posibles alias
  const cleanOrderBy = orderBy ? orderBy.replace(tableAlias, '') : defaultOrderBy;
  const safeOrderBy = validOrderFields.includes(cleanOrderBy) ? orderBy || defaultOrderBy : defaultOrderBy;
  const safeOrderDir = orderDir?.toUpperCase() === 'ASC' ? 'ASC' : defaultOrderDir;

  // ========================================
  // 5. FUNCIONES HELPER
  // ========================================
  
  /**
   * Construir SQL completo con WHERE, ORDER y LIMIT
   * IMPORTANTE: Usa LIMIT/OFFSET directos (sin placeholders) para evitar bug mysql2
   */
  const buildSQL = (baseQuery) => {
    return `${baseQuery} ${whereClause} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ${limitNum} OFFSET ${offset}`;
  };

  /**
   * Construir SQL de conteo con los mismos filtros
   */
  const countSQL = (tableName) => {
    return `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
  };

  /**
   * Ejecutar query con los parámetros construidos
   */
  const executeQuery = async (sql) => {
    return await query(sql, params);
  };

  /**
   * Contar total de registros
   */
  const executeCount = async (tableName) => {
    const sql = countSQL(tableName);
    const result = await query(sql, params);
    return result[0].total;
  };

  return {
    whereClause,
    params,
    orderBy: safeOrderBy,
    orderDir: safeOrderDir,
    limit: limitNum,
    offset,
    page: pageNum,
    buildSQL,
    countSQL,
    executeQuery,
    executeCount
  };
}

/**
 * Generar objeto de paginación estandarizado
 */
export function buildPaginationResponse(total, page, limit) {
  return {
    total: parseInt(total),
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  };
}

/**
 * Response estándar para endpoints de listado
 */
export function buildListResponse(items, total, filters, appliedFilters = {}) {
  return {
    success: true,
    data: {
      items,
      pagination: buildPaginationResponse(total, filters.page, filters.limit),
      filters: appliedFilters
    }
  };
}

/**
 * Helper para construir SQL de JOIN sin duplicar lógica
 */
export function buildJoinSQL(baseTable, joins = []) {
  let sql = `FROM ${baseTable}`;
  
  joins.forEach(join => {
    const { type = 'LEFT', table, on } = join;
    sql += ` ${type} JOIN ${table} ON ${on}`;
  });
  
  return sql;
}

/**
 * Validar y sanitizar valores numéricos
 */
export function sanitizeNumeric(value, defaultValue = 0, min = null, max = null) {
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  if (min !== null && num < min) return min;
  if (max !== null && num > max) return max;
  return num;
}

/**
 * Validar y sanitizar valores booleanos
 */
export function sanitizeBoolean(value) {
  if (value === undefined || value === null) return null;
  return value === 'true' || value === true || value === 1 || value === '1';
}

/**
 * Helper para construir IN clauses de forma segura
 */
export function buildInClause(field, values = []) {
  if (!Array.isArray(values) || values.length === 0) return null;
  
  const placeholders = values.map(() => '?').join(',');
  return {
    sql: `${field} IN (${placeholders})`,
    params: values
  };
}

/**
 * ========================================
 * EXPORTS
 * ========================================
 */
export default {
  buildQueryFilters,
  buildPaginationResponse,
  buildListResponse,
  buildJoinSQL,
  sanitizeNumeric,
  sanitizeBoolean,
  buildInClause
};