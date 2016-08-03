module.exports =
{ development:
  { client: 'mysql2'
  , secretKey: 'YouMustNotChangeThis'
  , fastHashSeed: 0xCAFEBABE
  , connection:
    { host: '127.0.0.1'
    , database: 'bm_dev'
    , user: 'root'
    , password: ''
    , charset: 'utf8'
    }
  , pool:
    { min: 2
    , max: 5
    }
  , migrations:
    { tableName: 'bm_web_migrations'
    }
  , seeds:
    { directory: './seeds'
    }
  , port: 60990
  , webClients: [ '*' ]
  , apiUrl: 'http://localhost:60990'
  }

, test:
  { client: 'mysql2'
  , secretKey: 'YouMustNotChangeThis'
  , connection:
    { host: '127.0.0.1'
    , database: 'bm_web_test'
    , user: 'root'
    , password: ''
    , charset: 'utf8'
    }
  , pool:
    { min: 2
    , max: 5
    }
  , migrations:
    { tableName: 'bm_web_migrations'
    }
  , seeds:
    { directory: './test/seeds'
    }
  }

, staging:
  { client: 'mysql2'
  , secretKey: 'YouMustChangeThis'
  , fastHashSeed: 0xCAFEBABE
  , connection:
    { host: '127.0.0.1'
    , database: 'bm_dev'
    , user: 'root'
    , password: ''
    , charset: 'utf8'
    }
  , pool:
    { min: 2
    , max: 5
    }
  , migrations:
    { tableName: 'bm_web_migrations'
    }
  , seeds:
    { directory: './seeds'
    }
  }

, production:
  { client: 'mysql2'
  , secretKey: 'YouMustChangeThis'
  , fastHashSeed: 0xCAFEBABE
  , connection:
    { host: '127.0.0.1'
    , database: 'bm_dev'
    , user: 'root'
    , password: ''
    , charset: 'utf8'
    }
  , pool:
    { min: 2
    , max: 10
    }
  , migrations:
    { tableName: 'bm_web_migrations'
    }
  , seeds:
    { directory: './seeds'
    }
  }

}
