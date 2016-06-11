module.exports =
{ development:
  { client: 'mysql2'
  , secretKey: 'YouMustNotChangeThis'
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
  }

, staging:
  { client: 'mysql2'
  , secretKey: 'YouMustChangeThis'
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
  }

, production:
  { client: 'mysql2'
  , secretKey: 'YouMustChangeThis'
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
  }

}
