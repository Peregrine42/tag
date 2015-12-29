import m from "mithril"
import _ from "lodash"

let Node = {
  base: "http://localhost:3000/dashboards",
  current_nodes: m.prop({ nodes: []}),
  params: () => {
    return `${Node.input_value()}`
  },
  current_query: () => {
    let parts = Node.params().split("/")
    return parts[0].split("+")
  },
  current_filter: () => {
    let parts = Node.params().split("/")
    return parts.slice(1) || []
  },
  build_url: () => {
    return `${Node.base}${Node.params()}.json`
  },
  input_value: m.prop("")
}

Node.list = () => {
  let response = m.request(
    {method: "GET", url: Node.build_url()}
  ).then((data) => {
    if (data.nodes.length > 0) {
      return data
    } else {
      Node.current_nodes()
    }
  })
  .then(Node.current_nodes)
  return response
}

Node.input_value("/internal_network/port_0")
Node.list()

setInterval(() => {
  Node.list()
}, 1000)

let NodeForm = {
  controller: () => {
    let nodes = Node.current_nodes
    let new_controller = {
      nodes: nodes
    }
    return new_controller
  },
  hash_as_array: (hash) => {
    let keys = Object.keys(hash);
    let values = keys.map((v, i) => {
      return { position: keys[i], name: hash[v] } ;
    });
    return values
  },
  occurances: (array) => {
    return _.groupBy(array, (item) => {
      return array.filter(
        (possible_item) => {
          return item.name === possible_item.name
        }
      ).length
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
    let frequency = NodeForm.occurances(tags)
    let all_tags = _.keys(frequency)
      .map((key) => {
        let tag_list = _.uniq(frequency[key], (i) => {
          return i.name
        })
        let count = parseInt(key)
        return tag_list.map(
          (tag) => {
            return {
              tag: tag,
              count: count,
              css_class: count == 1 ? "unique" : "common"
            }
          }
        ).reverse()
      })
    let flattened = _.flattenDeep(all_tags).reverse()
    let grouped = _.groupBy(flattened, (c_tag) => {
        return c_tag.tag.position
      })
    let grouped_values = _.values(grouped)
    let tag_ui = _.map(grouped_values, (item) => {
        return m("div", { class: "container" },
          m("div", { class: "padding" }),
          item .map((tag) => {
            return m(
              "div",
              m("input", {
                  class: "fade text-box " + tag.css_class,
                  value: `${tag.tag.name}`
                }
              ),
              tag.count == 1 ? [] : m("div",
                { class: "fade amount" },
                `${tag.count}`
              )
            )
          })
      )
    })
    return m("div", [
      m("input", {
        class: "title",
        value: Node.input_value(),
        oninput:
          m.withAttr("value", Node.input_value)
      }),
      m("div", {}, tag_ui),
    ])
  }
}

m.mount(document.body, NodeForm)
