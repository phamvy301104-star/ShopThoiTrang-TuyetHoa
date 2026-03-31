const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'shop_thoi_trang'};Trusted_Connection=yes;TrustServerCertificate=yes;`
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await new sql.ConnectionPool(config).connect();
        console.log('✓ Kết nối SQL Server thành công!');
    }
    return pool;
}

module.exports = { sql, getPool };
