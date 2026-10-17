
// 1. Importar el cliente de Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Configurar con tu URL y tu Public Key (anon key)
const supabaseUrl = 'https://jrjuodeuqdiaehmtwhiu.supabase.co';
const supabaseKey = 'sb_publishable_4Wcz5ZZQcZjp2jaw6ivVAA_k4-7g4yQ';
const supabase = createClient(supabaseUrl, supabaseKey);

var express = require("express");
var jwt = require("jwt-simple");
var clave = 'miSecretoMasOscuro';

var app = express();

app.use("/appCliente", express.static("Cliente_rest"));
app.use(express.json());

// Login de gestores
app.post("/api/gestores/login", async function(req, res) {

    const { data: gestores, error } = await supabase
        .from("gestores")
        .select("id")
        .eq("usuario", req.body.login)
        .eq("password", req.body.password);

    if (error) {
        console.log("Error al realizar select del gestor", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        if (gestores.length === 1) {
            console.log("Gestor:", gestores[0].id);

            var contenido = {
                usuario: gestores[0].id,
                expira: Date.now() + 60 * 60 * 1000
            };

            var token = jwt.encode(contenido, clave);

            res.status(200).json({
                id: gestores[0].id,
                token: token
            });
        } else {
            console.log("Credenciales invalidas");
            res.status(403).json("Credenciales invalidas");
        }
    }
});

// Crear gestor
app.post("/api/gestores", async function(req, res) {

    var gestor = req.body;

    const { data, error } = await supabase
        .from("gestores")
        .insert({
            nombre: gestor.nombre,
            apellidos: gestor.apellidos,
            usuario: gestor.usuario,
            password: gestor.password
        })
        .select("id");

    if (error) {
        console.log("Error al crear el nuevo usuario", error);
        res.status(500).json("Error al realizar la insercion");
    } else {
        console.log("Gestor insertado:", data);
        res.status(201).json(data[0].id);
    }
});

// Comprobar el token
app.use("/api", function(req, res, next) {

    var token = req.query.token;

    if (!token) {
        res.status(401).json("No se ha encontrado token");
        return;
    }

    try {
        var contenidoToken = jwt.decode(token, clave);
    } catch (error) {
        res.status(401).json("El token es incorrecto");
        return;
    }

    console.log("El contenido del token es:", contenidoToken);

    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) {
        res.status(401).json("El formato del token no es adecuado");
        return;
    }

    if (contenidoToken.expira < Date.now()) {
        res.status(401).json("El token ha expirado");
        return;
    }

    next();
});

// Actualizar gestor
app.put("/api/gestores/:id", async function(req, res) {

    var gestor = req.body;

    var valores = {
        nombre: gestor.nombre,
        apellidos: gestor.apellidos,
        usuario: gestor.usuario
    };

    if (gestor.password && gestor.password.trim() !== "") {
        valores.password = gestor.password;
    }

    const { data, error } = await supabase
        .from("gestores")
        .update(valores)
        .eq("id", req.params.id)
        .select("id");

    if (error) {
        console.log("Error al actualizar el gestor:", error);
        res.status(500).json("Error al actualizar el gestor");
    } else {
        if (data.length === 1) {
            res.status(200).json("Gestor actualizado");
        } else {
            res.status(404).json("Gestor no encontrado");
        }
    }
});

// Obtener gestor
app.get("/api/gestores/:id", async function(req, res) {

    const { data, error } = await supabase
        .from("gestores")
        .select("id, nombre, apellidos, usuario")
        .eq("id", req.params.id);

    if (error) {
        console.log("Error al realizar el select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        if (data.length === 1) {
            res.status(200).json(data[0]);
        } else {
            res.status(404).json("No se ha encontrado el gestor");
        }
    }
});

// Obtener categorias
app.get("/api/categorias", async function(req, res) {

    const { data, error } = await supabase
        .from("categorias")
        .select("*");

    if (error) {
        console.log("Error al realizar la select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Categorias:", data);
        res.status(200).json(data);
    }
});

// Obtener modelos
app.get("/api/modelos", async function(req, res) {

    const { data, error } = await supabase
        .from("modelos")
        .select("*");

    if (error) {
        console.log("Error al realizar la select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Modelos:", data);
        res.status(200).json(data);
    }
});

// Obtener ubicaciones
app.get("/api/ubicaciones", async function(req, res) {

    const { data, error } = await supabase
        .from("ubicaciones")
        .select("*");

    if (error) {
        console.log("Error al realizar la select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Ubicaciones:", data);
        res.status(200).json(data);
    }
});

// Obtener recursos con filtros
app.get("/api/recursos", async function(req, res) {

    var categoriaFiltro = req.query.categoria;
    var modeloFiltro = req.query.modelo;
    var ubicacionFiltro = req.query.ubicacion;
    var estadoFiltro = req.query.estado;

    var consulta = supabase
        .from("recurso")
        .select("*");

    if (categoriaFiltro) {

        const { data: modelos, error: errorModelos } = await supabase
            .from("modelos")
            .select("id")
            .eq("categoria", categoriaFiltro);

        if (errorModelos) {
            console.log("Error al consultar los modelos", errorModelos);
            res.status(500).json("Error al realizar la consulta");
            return;
        }

        if (modelos.length === 0) {
            res.status(200).json([]);
            return;
        }

        consulta = consulta.in("modelo", modelos.map(m => m.id));
    }

    if (modeloFiltro) {
        consulta = consulta.eq("modelo", modeloFiltro);
    }

    if (ubicacionFiltro) {
        consulta = consulta.eq("ubicacion", ubicacionFiltro);
    }

    if (estadoFiltro !== undefined && estadoFiltro !== "") {
        consulta = consulta.eq("estado", estadoFiltro);
    }

    const { data, error } = await consulta;

    if (error) {
        console.log("Error al realizar la consulta de recursos", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Recursos:", data);
        res.status(200).json(data);
    }
});

// Obtener recurso por ID
app.get("/api/recursos/:id", async function(req, res) {

    const { data, error } = await supabase
        .from("recurso")
        .select("*")
        .eq("id", req.params.id);

    if (error) {
        console.log("Error al realizar el select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        if (data.length === 1) {
            res.status(200).json(data[0]);
        } else {
            res.status(404).json("No se ha encontrado el recurso");
        }
    }
});

// Insertar recurso
app.post("/api/recursos", async function(req, res) {

    var recurso = req.body;

    const { data, error } = await supabase
        .from("recurso")
        .insert({
            modelo: recurso.modelo,
            ubicacion: recurso.ubicacion,
            numero_serie: recurso.numero_serie,
            estado: recurso.estado
        })
        .select("*");

    if (error) {
        console.log("Error al realizar el insert", error);
        res.status(500).json("Error al realizar la insercion");
    } else {
        console.log("Recurso insertado:", data);
        res.status(201).json(data[0]);
    }
});

// Actualizar recurso
app.put("/api/recursos/:id", async function(req, res) {

    var recurso = req.body;

    const { data, error } = await supabase
        .from("recurso")
        .update({
            modelo: recurso.modelo,
            ubicacion: recurso.ubicacion,
            numero_serie: recurso.numero_serie,
            estado: recurso.estado
        })
        .eq("id", req.params.id)
        .select("id");

    if (error) {
        console.log("Error al actualizar el recurso", error);
        res.status(500).json("Error al realizar la actualizacion");
    } else {
        if (data.length === 1) {
            res.status(200).json("Recurso actualizado");
        } else {
            res.status(404).json("Recurso no encontrado");
        }
    }
});

// Eliminar recurso
app.delete("/api/recursos/:id", async function(req, res) {

    const { data, error } = await supabase
        .from("recurso")
        .delete()
        .eq("id", req.params.id)
        .select("id");

    if (error) {
        console.log("Error al realizar el delete", error);
        res.status(500).json("Error al realizar el borrado");
    } else {
        if (data.length === 1) {
            res.status(200).json("Recurso eliminado");
        } else {
            res.status(404).json("Recurso no encontrado");
        }
    }
});

// Obtener sanitario
app.get("/api/sanitarios/:id", async function(req, res) {

    const { data, error } = await supabase
        .from("sanitarios")
        .select("id, nombre, apellidos, usuario")
        .eq("id", req.params.id);

    if (error) {
        console.log("Error al realizar el select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        if (data.length === 1) {
            res.status(200).json(data[0]);
        } else {
            res.status(404).json("No se ha encontrado el sanitario");
        }
    }
});

// Obtener reseñas de un recurso
app.get("/api/recursos/:id/resenyas", async function(req, res) {

    const { data, error } = await supabase
        .from("resenyas")
        .select("*")
        .eq("recurso", req.params.id);

    if (error) {
        console.log("Error al realizar el select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Resenyas:", data);
        res.status(200).json(data);
    }
});

// Obtener reservas de un recurso
app.get("/api/recursos/:id/reservas", async function(req, res) {

    const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("recurso", req.params.id);

    if (error) {
        console.log("Error al realizar el select", error);
        res.status(500).json("Error al realizar la consulta");
    } else {
        console.log("Reservas:", data);
        res.status(200).json(data);
    }
});

// Iniciar servidor
app.listen(3000, function() {
    console.log("Servidor iniciado en el puerto 3000");
    console.log("http://localhost:3000/appCliente/index.html");
});
