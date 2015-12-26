import m from "mithril"
import _ from "lodash"

let Node = {
  base: "http://localhost:3000/dashboards",
  current_query: m.prop(["inet_network"]),
  current_filter: m.prop(["port_0"]),
  list: () => {
    return m.request(
      {method: "GET", url: Node.build_url()}
    )
  },
  params: () => {
    let query_string = "/"+Node.current_query().join("+")
    let filter_string =
      "/" + Node.current_filter().join("/")
    return `${query_string}${filter_string}`
  },
  build_url: () => {
    return `${Node.base}${Node.params()}.json`
  }
}

let NodeForm = {
  controller: () => {
    let nodes = Node.list()
    return {
      nodes: nodes
    }
  },
  hash_as_array: (hash) => {
    let keys = Object.keys(hash);
    let values = keys.map((v, i) => {
      return { position: keys[i], name: hash[v] } ;
    });
    return values
  },
  unique_occurances: (array) => {
    return _.groupBy(array, (item) => {
      return array.filter(
        (possible_item) => {
          return item.name === possible_item.name
        }
      ).length > 1
    })
  },
  filtered: (ctrl) => {
    return _
      .flattenDeep(
        ctrl.nodes().nodes.map((node) => {
          let tags = NodeForm.hash_as_array(node.tags)
          return tags
            .filter((tag) => {
              return !Node.current_query()
                .includes(tag.name)
            })
            .filter((tag) => {
              return !Node.current_filter()
                .includes(tag.name)
            })
      })
    )
  },
  view: (ctrl) => {
    let tags = NodeForm.filtered(ctrl)
    let is_unique = NodeForm.unique_occurances(tags)
    let unique_tags = is_unique[false] || []
    let common_tags = _.uniq(
      is_unique[true] || [], (item) => {
        return item.name
    })
    console.log(unique_tags)
    return m("div", [
      m("h1", Node.params()),
      m("div",
        common_tags
          .map((tag) => {
            return m(
              "input",
              { class: "text-box common",
                value: tag.name }
            )
          }),
        unique_tags
          .map((tag) => {
            return m(
              "input",
              { class: "text-box unique",
                value: tag.name }
            )
          })
      ),
    ])
  }
}

m.mount(document.body, NodeForm)
