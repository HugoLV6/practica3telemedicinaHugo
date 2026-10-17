var conexion = require("./conexion_mysql.js")
var express = require("express"); // para requerir el express
var jwt = require("jwt-simple");
var clave = 'miSecretoMasOscuro';
var app = express();
app.use("/appCliente", express.static("Cliente_rest"));
app.use(express.json()); 



app.post("/api/gestores/login", function(req, res) { //comprobar las credenciales de un gestor para iniciar sesión
    
    var sql = "SELECT id FROM gestores WHERE usuario='" + req.body.login + "' AND password='" + req.body.password + "'"; // Consulta SQL para verificar las credenciales del gestor

    conexion.query(sql, function(err, id) {
        if (err) {
            console.log("Error al realizar select del gestor", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            if (id.length === 1) {
                console.log("Gestor:", id[0].id);
                var contenido = {
                    usuario: id[0].id,
                    expira: Date.now() + 60 * 60 * 1000
                };
                var token = jwt.encode(contenido, clave);
                res.status(200).json({
                    id: id[0].id,
                    token: token
                });
            } else {
                console.log("Credenciales invalidas");
                res.status(403).json("Credenciales invalidas");
            }
        }
    });
});

app.post("/api/gestores",function(req,res){

    var gestor =req.body; // Obtener los datos del gestor del cuerpo de la petición
    var sql = "INSERT INTO gestores (nombre, apellidos, usuario, password) VALUES (?, ?, ?, ?)";  // Consulta SQL para insertar un nuevo gestor en la base de datos

    conexion.query(sql, [gestor.nombre, gestor.apellidos, gestor.usuario, gestor.password], function(err, resultado) { // Ejecutar la consulta SQL con los datos del gestor
            if(err){
                console.log("Error al crear el nuevo usuario");
                res.status(500).json("Error al realizar la insercion");

            } else {
                console.log("Gestor insertado:", resultado);
                res.status(201).json(resultado.insertId);
            }
            
        });
});

app.use("/api", function (req, res, next) {
    var token = req.query.token;

    if (!token) {
        res.status(301).json("No se ha encontrado token");
        return;
    }

    try {
        var contenidoToken = jwt.decode(token, clave);
    } catch (error) {
        res.status(301).json("El token es incorrecto");
        return;
    }

    console.log("El contenido del token es:", contenidoToken);

    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) {
        res.status(301).json("El formato del token no es adecuado")
        return;
    }

    if (contenidoToken.expira < Date.now()) {
        res.status(301).json("El token ha expirado");
        return
    }

    next();
});

app.put("/api/gestores/:id", function(req, res) {
    var gestor = req.body;
    var sql;
    var valores;
    if(gestor.password && gestor.password.trim() !== ""){
        sql = "UPDATE gestores SET nombre = ?, apellidos = ?, usuario = ?, password = ? WHERE id = ?";
        valores = [gestor.nombre, gestor.apellidos, gestor.usuario, gestor.password, req.params.id];
    }
    else{
        sql = "UPDATE gestores SET nombre = ?, apellidos = ?, usuario = ? WHERE id = ?";
        valores = [gestor.nombre, gestor.apellidos, gestor.usuario, req.params.id];
    }

    conexion.query(sql, valores, function(err, resultado) {

        if(err){
            console.log("Error al actualizar el gestor:", err);
            res.status(500).json("Error al actualizar el gestor");
        }
        else{
            if(resultado.affectedRows === 1){
                console.log("Gestor actualizado");
                res.status(200).json("Gestor actualizado");
            }
            else{
                res.status(404).json("Gestor no encontrado");
            }
        }
    });
});

app.get("/api/gestores/:id",function(req,res){ // Obtener los datos de un gestor por su ID (sin contraseña)
    
    var idGestor = req.params.id;
    var sql = "SELECT id, nombre, apellidos, usuario FROM gestores WHERE id = " + idGestor; 
    conexion.query(sql, function (err, gestores){
        if(err){
            console.log ("Error al realizar el select");
            res.status(500).json("Error al realizar la consulta")
        }
        else{
            if(gestores.length ===1){ // Si se encuentra un gestor con el ID proporcionado
                console.log("Gestor: ", gestores[0]);
                res.status(200).json(gestores[0]);
            }
            else{
                console.log("No se ha encontrado el gestor con id ", idGestor);
                res.status(404).json("No se ha encontrado el gestor");
            }
        }
    });
});

app.get("/api/categorias", function (req, res) {
    var sql = "SELECT * FROM categorias";
    conexion.query(sql, function (err, categorias) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Categorias:", categorias);
            res.status(200).json(categorias);
        }
    });
});
app.get("/api/modelos", function (req, res) {
    var sql = "SELECT * FROM modelos";
    conexion.query(sql, function (err, modelos) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Modelos:", modelos);
            res.status(200).json(modelos);
        }
    }); 
});
app.get("/api/ubicaciones", function (req, res) {
    var sql = "SELECT * FROM ubicaciones";
    conexion.query(sql, function (err, ubicaciones) {
        if (err) {
            console.log("Error al realizar la select", err);
            res.status(500).json("Error al realizar la consulta");
        } else {
            console.log("Ubicaciones:", ubicaciones);
            res.status(200).json(ubicaciones);
        }
    });
});

app.get("/api/recursos", function (req, res) {
    // Los query parameters se acceden con req.query
    var categoriaFiltro = req.query.categoria;
    var modeloFiltro = req.query.modelo;
    var ubicacionFiltro = req.query.ubicacion;
    var estadoFiltro = req.query.estado;
    var sql = "SELECT recurso.* FROM recurso JOIN modelos ON recurso.modelo = modelos.id";

    var hayFiltro = false;

    if(categoriaFiltro){
        sql += " WHERE modelos.categoria = " + categoriaFiltro; // Si hay un filtro de categoría, se agrega a la consulta SQL
        hayFiltro = true;
    }

    if(modeloFiltro){
        if(hayFiltro){ // Si ya hay un filtro aplicado, se agrega el filtro de modelo con AND
            sql += " AND recurso.modelo = " + modeloFiltro;
        }
        else{ // Si no hay ningún filtro aplicado, se agrega el filtro de modelo con WHERE
            sql += " WHERE recurso.modelo = " + modeloFiltro;
            hayFiltro = true;
        }
    }

    if(ubicacionFiltro){
        if(hayFiltro){
            sql += " AND recurso.ubicacion = " + ubicacionFiltro;
        }
        else{
            sql += " WHERE recurso.ubicacion = " + ubicacionFiltro;
            hayFiltro = true;
        }
    }

    if(estadoFiltro !== undefined && estadoFiltro !== ""){ // Se verifica si el filtro de estado está definido y no es una cadena vacía
    if(hayFiltro){
        sql += " AND recurso.estado = " + estadoFiltro;
    }
    else{
        sql += " WHERE recurso.estado = " + estadoFiltro;
        hayFiltro = true;
    }
}

    conexion.query(sql, function(err, recursos) {

        if(err){
            console.log("Error al realizar la consulta de recursos", err);
            res.status(500).json("Error al realizar la consulta");
        }
        else{
            console.log("Recursos:", recursos);
            res.status(200).json(recursos);
        }
    });
});

app.get("/api/recursos/:id", function(req, res){ 
    var idRecurso = req.params.id;
    var sql = "SELECT * FROM recurso WHERE id = " + idRecurso; // Consulta SQL para obtener los datos de un recurso por su ID
    conexion.query(sql, function (err, recurso){
        if(err){
            console.log ("Error al realizar el select");
            res.status(500).json("Error al realizar la consulta")
        }
        else{
            if(recurso.length ===1){
                console.log("Recurso: ", recurso[0]);
                res.status(200).json(recurso[0]);
            }
            else{
                console.log("No se ha encontrado el recurso con id ", idRecurso);
                res.status(404).json("No se ha encontrado el recurso");
            }
        }
    });

});

app.post("/api/recursos", function(req, res){
    var recurso = req.body;
    var sql = "INSERT INTO recurso (modelo, ubicacion, numero_serie, estado) VALUES (?, ?, ?, ?)"; // Consulta SQL para insertar un nuevo recurso en la base de datos
    conexion.query(sql,
        [recurso.modelo, recurso.ubicacion, recurso.numero_serie, recurso.estado], // Ejecutar la consulta SQL con los datos del recurso
        function(err, resultado){
        if (err) {
            console.log("Error al realizar el insert", err);
            res.status(500).json("Error al realizar la insercion");
        } else {
            console.log("Recurso insertado:", resultado);
            res.status(201).json(resultado);
        }
    });

});

app.put("/api/recursos/:id", function(req, res){  // actualizar los datos de un recurso existente
    
    var recurso = req.body;
    var sql = "UPDATE recurso SET modelo = ?, ubicacion = ?, numero_serie = ?, estado = ? WHERE id = ?";

    conexion.query(sql, 
        [recurso.modelo, recurso.ubicacion, recurso.numero_serie, recurso.estado, req.params.id], 
        function(err, resultado) {    
        if(err){
            console.log("Error al actualizar el  recurso");
            res.status(500).json("Error al realizar la insercion");

        } else {
            if(resultado.affectedRows === 1){
                res.status(200).json("Recurso actualizado");
            }
            else{
                res.status(404).json("Recurso no encontrado");
            }
        }
    });
});
    
    
   

app.delete("/api/recursos/:id", function(req, res){
    var sql = "DELETE FROM recurso WHERE id = " + req.params.id;
    conexion.query(sql, function (err, resultado) {
        if (err) {
            console.log("Error al realizar el delete", err);
            res.status(500).json("Error al realizar el borrado");
        } else {
            if(resultado.affectedRows === 1){
                console.log("Recurso borrado");
                res.status(200).json("Recurso eliminado");
            }
            else{
                res.status(404).json("Recurso no encontrado");
            }
        }
    });
});

app.get("/api/sanitarios/:id", function (req, res) {
    var idSanitario = req.params.id;
    var sql = "SELECT id, nombre, apellidos, usuario FROM sanitarios WHERE id = " + idSanitario;
    conexion.query(sql, function (err, sanitario){
        if(err){
            console.log ("Error al realizar el select");
            res.status(500).json("Error al realizar la consulta")
        }
        else{
            if(sanitario.length ===1){
                console.log("sanitario: ", sanitario[0]);
                res.status(200).json(sanitario[0]);
            }
            else{
                console.log("No se ha encontrado el sanitario con id ", idSanitario);
                res.status(404).json("No se ha encontrado el sanitario");
            }
        }
    });
});

app.get("/api/recursos/:id/resenyas",function(req,res){
    var idRecurso = req.params.id;
    var sql = "SELECT * FROM resenyas WHERE recurso = " + idRecurso;
    conexion.query(sql, function (err, resenyas){
        if(err){
            console.log ("Error al realizar el select");
            res.status(500).json("Error al realizar la consulta")
        }
        else{    
            console.log("resenyas: ", resenyas);
            res.status(200).json(resenyas);
        }
    });
});
app.get("/api/recursos/:id/reservas",function(req,res){
    var idRecurso = req.params.id;
    var sql = "SELECT * FROM reservas WHERE recurso = " + idRecurso;
    conexion.query(sql, function (err, reservas){
        if(err){
            console.log ("Error al realizar el select");
            res.status(500).json("Error al realizar la consulta")
        }
        else{    
            console.log("reservas: ", reservas);
            res.status(200).json(reservas);
        }
    });
});


app.listen(3000, function(){
    console.log("Servidor iniciado en el puerto 3000");
    console.log("http://localhost:3000/appCliente/index.html");
});