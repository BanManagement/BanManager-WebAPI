module.exports = async function adminNavigation(obj, info, { state }) {
  const [ [ { rolesCount } ] ] = await state.dbPool.execute('SELECT COUNT(*) AS rolesCount FROM bm_web_roles')
  const left =
  [ { id: 1, name: 'Roles', label: rolesCount, href: '/admin/roles' }
  , { id: 2, name: 'Servers', label: state.serversPool.size, href: '/admin/servers' }
  ]

  return { left }
}
