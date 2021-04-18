"use strict";
//Variables globales
var $main_ex = null;  //Contenedor principal de la expresión.
var pos_exp = -1;  //Variable global para crear exponente con ^.

//Variables de estado. 
//Describen al wrap actual, el que está siendo editado.
var $w_curf =null;  //Campo Seleccionado 
var $w_cur = null;  //Wrap con enfoque
var $w_next = null; //Wrap siguiente
var $w_prev = null; //Wrap anterior
var $w_par  = null; //Wrap padre
var o_cur   = null; //Referencia a objeto.
var o_next  = null; //Referencia a objeto.
var o_prev  = null; //Referencia a objeto.
var w_txt = '';     //Texto que esta siendo editado.
var w_pos = 0;      //Desplazamiento del cursor
var cur_beg = false; //Bandera de posición inicial.
var cur_end = false; //Bandera de posición final.
//Funciones principales
function update_state() {
    /* Actualiza las variables globales que describen las propiedades del
    elemento wrap actualmente seleccionado.
    Si no logra actualizar, devuelve FALSE. */
    $w_curf=$(":focus");                    //Elemento seleccionado.
    if (!$w_curf.hasClass('field')) return false;  //Solo para campos
    $w_cur = $w_curf.closest('.wrap');      //Wrap con enfoque
    $w_next = $w_cur.next();
    $w_prev = $w_cur.prev();
    $w_par  = $w_cur.parent().closest('.wrap');    //Accede al wrap padre. Se usa parent() porque closest() busca desde el mismo nivel.
    o_cur   = $w_cur.get(0).obj;
    o_next  = $w_next.length>0?$w_next.get(0).obj:null;
    o_prev  = $w_prev.length>0?$w_prev.get(0).obj:null;
    //Información del texto
    w_txt = $w_curf.get(0).innerText;
    w_pos = window.getSelection().anchorOffset;  //Desplazamiento del cursor
    cur_beg = w_pos==0?true:false;          //Bandera de posición
    cur_end = w_pos==w_txt.length?true:false; //Bandera de posición
    return true;
}
function set_matex_node(selector) {
   /* Configura un elemento para que sea el contenedor de una expresión 
   matemática. El elemento se define con la cadena "selector" al estilo de 
   Jquery y debe ser un elemento único. De preferencia debe ser ubn simple
   <div>. */
   $main_ex = $(selector);
   //Procesamiento del teclado.
   $main_ex.keydown(function (event) {
      //Procesa tecla pulsada
      switch (event.which) {
         case 37: case 39:  //Direccional izquierda y derecha.
         case 38: case 40:  //Direccional arriba y abajo.
         case 46:           //Delete.
            if (!update_state()) return;
            //Algunos wrap procesan sus eventos
            var result={};  //Objeto para resultado.
            result.delete = false;  //Bandera que indica que se debe borrar un wrap
            result.$wrap_del = null;  //Elemento wrap que debe ser borrado.
            if (o_cur.keydown(event.which, result)) {
               //Se procesó el evento.
               if (result.delete) {  //Se debe eliminar
                  // Actualiza variables de entorno para eliminación.
                  $w_cur  = result.$wrap_del;
                  $w_next = $w_cur.next();
                  $w_prev = $w_cur.prev();  //Anterior al operador
                  $w_par  = $w_cur.parent().closest('.wrap');    //Accede al wrap padre. Se usa parent() porque closest() busca desde el mismo nivel.
                  // Proceso de eliminación.
                  if ($w_par.children().length==1) break;  //Solo queda uno
                  if ($w_prev.length==0 && $w_cur.hasClass('opdo')) break;  //Es el primer operando. No se permite eliminar al primer operando.
                  if ($w_next.length==0 && $w_cur.hasClass('opdo')) break;  //Es el último operando. No se permite eliminar al primer operando.
                  //Hay más de un "wrap"
                  if ($w_next.length) {  //Hay siguiente wrap
                     $w_cur.remove();  //Elimina elemento
                     selectWrap($w_next,0);
                     //Verifica si deja dos operandos juntos, para fusionarlos.
                     mergeOperands($w_prev);
                  } else {  //No hay siguiente, es el último
                     $w_cur.remove();  //Elimina elemento
                     if ($w_prev.length) {  //Pero hay previo
                        selectWrap($w_prev,0);
                     }
                  }
                  //validate_wraps($w_par);
               }
               //Terminamos el procesamiento.
               event.preventDefault();
               return false;  //Para detener el evento
            }
            break;
         //default:
         //   console.log(event.which);
      }
   });
   $main_ex.keypress(function (event) {
      //Procesa tecla pulsada
      var w = event.which;
      if ((w>=65 && w<=90) || (w>=97 && w<=122) || 
          (w>=48 && w<=57)) {  //Alfabético
         if (pos_exp>-1) {  //Estamos en modo exponente.
            if (!update_state()) return;
            var exp = String.fromCharCode(w);
            //alert('exponente:' + exp);
            var opdr = new o_pow()
            setTextWrap(opdr.$w.prev(), w_txt.substring(0,pos_exp));
            pos_exp = -1;  //Finaliza estado de exponente.
         }
      }
      switch (event.which) {
         case 43: //Operador +
            break;  
         case 45: //Operador -
            break;
         case 94: //Operador ^
            //Guarda posición del cursor
            pos_exp = window.getSelection().anchorOffset;  
            break;
      }
      //console.log(event.which);
   });
   
}
function selectWrap($wrp, fld_n, curpos=0) {
    /* Pone el enfoque al "wrap" $wrp. 
    El parámetro "fld_n" indica el número de "field" que se debe seleccionar,
    si es que existe más de uno. El valor 0 se refiere al primero. Para contar
    desde el final, se usan índices negativos. Así -1 se refiere al último. 
    El parámetro "curpos" indica la posición del cursor.*/
    var field = $wrp.find('.field').get(fld_n);  //Obtiene elemento
    field.focus();
    if (curpos<0) {  //Se referenciará con respecto al final.
        curpos=field.innerText.length+curpos+1;
        if (curpos<0) curpos=0;
    }
    setCursor(field, curpos);
}
function mergeOperands($wrp) {
    /* Verifica si el wrap $wrp, y el siguiente, son ambos de tipo
    operando, y de ser así, los fusiona en uno solo. Si hay fusión
    devuelve TRUE.*/
    var $wrp_parent = $wrp.parent().closest('.wrap.opdo');
    if ($wrp.hasClass('opdo')) {
        //Es un operando. Verifica si hay otro despues´.
        if ($wrp.next().hasClass('opdo')) {
            //Hay otro después, se pueden unir.
            console.log('  2 operandos');
            if ($wrp_parent.children().length==2) {
                /*Solo quedan dos operandos, dentro de este operando. Se deben
                 fusionar en un solo "field", para que $wrp_parent quede como
                 un operadno simple. */
                var txt = getTextWrap($wrp);
                var txt2 = getTextWrap($wrp.next());
                var $wrp_next = $wrp.next();  //Guarda referencia.
                $wrp.remove();  //Elimina el actual (incluyendo al objeto)
                $wrp_next.remove();  //Elimina el siguiente (incluyendo al objeto)
                $wrp_parent.html('<span class="field" role="textbox" contenteditable></span>'); //Agrega "field"
                setTextWrap($wrp_parent, txt + txt2);
                //Posiciona cursor en medio
                var body = $wrp_parent.find('.field').get(0);
                setCursor(body, txt.length);
                return true;  //Sale
            } else {
                //Junta el contenido de los wrap
                var txt = getTextWrap($wrp);
                var txt2 = getTextWrap($wrp.next());
                setTextWrap($wrp, txt + txt2);
                $wrp.next().remove();  //Elimina el siguiente
                //selectWrap($wrp);
                //Posiciona cursor en medio
                var body = $wrp.find('.field').get(0);
                setCursor(body, txt.length);
                return true;  //Sale
            }
        }
     }
     return false;
}
/* Funciones para manejo de texto. */
function setCursor(fld, pos) { 
    /* Utilidad para posicionar el cursor en un elemento editable.
    "fld" es el elemento del DOM que es editable. */
    if (!fld.hasChildNodes()) return;  //Probablemente el elemento está vacío
    var range = document.createRange(); 
    var sel = window.getSelection(); 
    range.setStart(fld.childNodes[0], pos); 
    range.collapse(true); 
    sel.removeAllRanges(); 
    sel.addRange(range); 
    fld.focus(); 
}
function setTextWrap($wrp, txt) {
    /* Fija el contenido del texto de un wrap.*/
    $wrp.find('.field').get(0).innerText = txt;
}
function getTextWrap($wrp) {
    /* Lee el contenido del texto de un wrap.*/
    return $wrp.find('.field').get(0).innerText;
}
function setFontSize($wrp, size) {
   /* Fija el tamaño de texto de un wrap. "size" es una cadena que define el 
   tamaño. Debe incluir unidades como "px". */
   $wrp.css("fontSize", size);
}
/* Manejo del contenido de los operandos. */
function field_to_opdo($wrp) {
    /* Convierte el campo editable de un operando a un operador, de modo que se
    tendrá un operando compuesto. 
    Devuelve la referencia al operando creado.*/
    var txt = $wrp.children().text();  //Lee texto. Debería haber un solo elemento.
    $wrp.children().remove();  //Elimina el campo editable ("field").
    var obj = new o_opdo($wrp, false);  //Crea objeto.
    obj.$w.find('.field').text(txt);  //Restaura el texto.
    return obj.$w;  //Devuelve operando.
}
function field_to_opdo_break($wrp, pos) {
    /* Convierte el campo editable de un operando en dos operandos, de modo que se
    tendrá un operando compuesto.
    El primer operando contendrá el texto desde la posición 0 hasta "pos".
    El segundo operando contendrá el texto restante.
    Devuelve la referencia al primer operando creado.*/
    var txt = $wrp.children().text();  //Lee texto. Debería haber un solo elemento.
    var txt1 = txt.substring(0, pos); //Recorta texto
    var txt2 = txt.substring(pos);

    $wrp.children().remove();  //Elimina el campo editable ("field").
    var obj1 = new o_opdo($wrp, false);  //Crea objeto.
    obj1.$w.find('.field').text(txt1);  //Restaura el texto.
    var obj2 = new o_opdo($wrp, false);  //Crea objeto.
    obj2.$w.find('.field').text(txt2);  //Restaura el texto.
    return obj1.$w;  //Devuelve operando.
}
function opdo_string(fieldClass, wr_style="") {
   /* Devuelve un HTML que define a un operador. 
   "fieldClass" es la clase adicional que se agregará al campo "field".
   "wr_style" es la cadena que define el estilo. Las comillas dobles deben ser
   escapadas.
   */
   return '<div class="wrap opdo" style="'+wr_style+'">'+
   //No dejar espacio entre el <span> y </span> para evitar valores iniciales.   
   '<span class="field '+fieldClass+'" role="textbox" contenteditable></span>'+
          '</div>'; 
}
function insert_opdo($opdo, wr_style="") {
    /* Agrega un elemento "wrap-operando", al final del contenedor $opdo. */
    $opdo.append(opdo_string('', wr_style));
    return $opdo.children().last();
}
function insert_opdo_after($wr, wr_style="") {
    /* Agrega un elemento "wrap-operando", después del wrap $wr. */
    $wr.after(opdo_string('', wr_style));
    return $wr.next();
}
function insert_opdo_before($wr, wr_style="") {
    /* Agrega un elemento "wrap-operando", después del wrap $wr. */
    $wr.before(opdo_string('', wr_style));
    return $wr.prev();
}
function insert_opdr($opdo, h_opdr) {
    /* Agrega un elemento "wrap-operador", en al final del contenedor $opdo. */
    $opdo.append(h_opdr);
    return $opdo.children().last();
}
function insert_opdr_after($wr, h_opdr) {
    /* Agrega un elemento "wrap-operador", después del wrap $wr. */
    $wr.after(h_opdr);
    return $wr.next();
}
function insert_opdr_before($wr, h_opdr) {
    /* Agrega un elemento "wrap-operador", después del wrap $wr. */
    $wr.before(h_opdr);
    return $wr.prev();
}
/* Rutinas para agregar operandos y operadores en la posición actual */
function add_opdr(h_opdr, $wr_par, $wr, curbeg, curend, curpos) {
    /* Inserta un operador en la posición del cursor, definida por (curbeg,
     curend y curpos). 
     "h_opdr" es el HTML del operador.
     "$wr_par" es el wrap padre.
     "$wr" es el operando que contiene el "field", en donde se insertará al 
     operador.
     "curbeg" y "curend" son banderas que indican si el cursor está al inicio 
     o al fin de la cadena. Si ninguno está en TRUE, se asume que la posición
     del cursor es "curpos"
     Devuelve el operador insertado. Si no inserta ninguno, devuelve NULL. */
    if ($wr==null) return null;
    var $opdr = null;  //Valor de retorno por defecto.
    if ($wr.children().length==0) {  //Está vacío
       $opdr = insert_opdr($wr, h_opdr);
       return $opdr;
    }
    //Hay al menos un elemento
    //Verificamos si estamos dentro de un operador
    if ($wr.hasClass('opdr')) {  //Insertar operador dentro de operador
        alert('No implementado'); //¿Podría pasar considerando que todo campo editable pertenece a un operando?
    } else if ($wr.hasClass('opdo')) {  //Insertar dentro de operando
         //El operador se insertará dependiendo de dónde se encuentre con respecto al operando
         if ($wr_par.length==0) {  //Estamos en el operando principal
            /* El operando principal es único, así que no se puede agregar
            operadores fuera de él. Todo se hará dentro. */
            if (curend) {  //Al final del texto
                  var $new_opdo = field_to_opdo($wr);  //Convierte texto a operando.
                  $opdr = insert_opdr_after($new_opdo, h_opdr);
new o_opdo($wr, false);  //Crea operador al final para guardar consistencia.
                  return $opdr;
            } else if (curbeg) {  //Al inicio del texto
                  var $new_opdo = field_to_opdo($wr);  //Convierte texto a operando.
                  $opdr = insert_opdr_before($new_opdo, h_opdr);
                  return $opdr;
            } else {  //En medio del texto
                  //Se debe dividir el operando e insertar al centro
                  var $new_opdo = field_to_opdo_break($wr, curpos);
                  $opdr = insert_opdr_after($new_opdo, h_opdr);  //Agrega operador después
                  return $opdr;
            }
         } else if ($w_par.hasClass('opdo')) {  //Hay un wrap-operando contenedor.
            /* Dentro de un operando contenedor, los operadores se agregan al
            mismo nivel que el operando actual. */
            if (curend) {  //Al final del texto
               $opdr = insert_opdr_after($wr, h_opdr);
new o_opdo($w_par, false);  //Crea operador al final para guardar consistencia.
               return $opdr;
            } else if (curbeg) {  //Al inicio del texto
               $opdr = insert_opdr_before($wr, h_opdr);
               return $opdr;
            } else {  //En medio del texto
               //Se debe dividir el operando e insertar al centro
               $opdr = insert_opdr_after($wr, h_opdr);  //Agrega operador después
               var new_opdo = new o_opdo($opdr, false, "", true);  //Agrega otro operando después              
               setTextWrap($wr, w_txt.substring(0, w_pos)); //Recorta texto
               setTextWrap(new_opdo.$w, w_txt.substring(curpos)); //Pone el resto en el otro operando.
               return $opdr;
            }
         } else if ($w_par.hasClass('opdr')) {  //Hay un wrap-operador contenedor.
            //Igual que si estuviera en el operando principal.
            if (curend) {  //Al final del texto
                  var $new_opdo = field_to_opdo($wr);  //Convierte texto a operando.
                  $opdr = insert_opdr_after($new_opdo, h_opdr);
new o_opdo($wr, false);  //Crea operador al final para guardar consistencia.
                  return $opdr;
            } else if (curbeg) {  //Al inicio del texto
                  var $new_opdo = field_to_opdo($wr);  //Convierte texto a operando.
                  $opdr = insert_opdr_before($new_opdo, h_opdr);
                  return $opdr;
            } else {  //En medio del texto
                  //Se debe dividir el operando e insertar al centro
                  var $new_opdo = field_to_opdo_break($wr, curpos);
                  $opdr = insert_opdr_after($new_opdo, h_opdr);  //Agrega operador después
                  return $opdr;
            }
         }
    }
    return null;
}
function validate_wraps($root_opdo) {
   /* Valida la estructura de elementos "wrap" dentro del operando $root_opdo.
   para asegurar que se tendra consistencia: */
   //Valida que haya al menos un elemento
   var $wraps = $root_opdo.children('.wrap');
   if ($wraps.length==0) {  //Está vacío
//       console.log('Sin elementos');
      return;
   }
   //Valida que el último elemento, sea siempre un "operando"
   var $l = $wraps.last(); 
   if (!$l.hasClass('opdo')) {
      //Agrega operando, para que la edición sea más llevadera.
      new o_opdo($root_opdo, false);
   }
   //Fusiona dos operandos juntos
   $wraps.each(function () {
      var $this = $(this);
      if ($this.hasClass('opdr')) {
         //Redimensiona operadores
         this.obj.resize();
      }
   });
}
///////////// Objetos que representan a operandos /////////////
function o_opdo($root_opdo, sel_opdo, wr_style="", after=false) {
   /* Este constructor crea un operando dentro del wrap "$root_opdo". 
   Si el parámetro "sel_opdo" se pone a TRUE, se seleccionará el operando
   insertado.
   El parámetro "wr_style" es el estilo a aplicar al operando.
   El parámetro "after" indica que el operando se debe crear después de 
   $root_opdo. Normalmente se crea dentro de $root_opdo, al final.
    */
   this.$w  = null;  //Referencia al wrap que representa al objeto
   this.recv_cursor_right = function() { //Recibe el cursor por la derecha
      //Tomamos el enfoque y seleccionamos el único campo editable.
      if (this.isSimple()) {
         selectWrap(this.$w, 0, -1);  //Ponemos el cursor al final.
      } else {
         var $last = this.$w.children().last();
         $last.get(0).obj.recv_cursor_right();
         //selectWrap($last, 0, -1);  Debería funcionar porque el último wrap de un operando compuesto es siempre un operando simple.
      }
   }
   this.recv_cursor_left = function() {  //Recibe el cursor por la izquierda
      //Tomamos el enfoque y seleccionamos el único campo editable.
      if (this.isSimple()) {
         selectWrap(this.$w, 0, 0);
      } else {  //Es operando compuesto
         var $first = this.$w.children().first();
         $first.get(0).obj.recv_cursor_left();
         //selectWrap($first, 0, 0);
      }
   }
   this.cursor_right = function() {    //Cursor al final
      /* Indica que este operando (o el último de sus wrap interiores) tiene el 
      enfoque y el cursor está al final del texto. 
      Deben estar actualizados: $w_cur, y cur_end.  */
      if (this.isSimple()) { //Operando simple
         return $w_cur.is(this.$w) && cur_end;
      } else {  //Es operando compuesto
         var $last = this.$w.children().last();
         return $last.get(0).obj.cursor_right();
      }
   }
   this.cursor_left = function() {     //Cursor al inicio
      /* Indica que este operando (o el primero de sus wrap interiores) tiene el 
      enfoque y el cursor está al inicio del texto. 
      Deben estar actualizados: $w_cur, y cur_beg.  */
      if (this.isSimple()) {
         return $w_cur.is(this.$w) && cur_beg;
      } else {  //Es operando compuesto
         var $first = this.$w.children().first();
         return $first.get(0).obj.cursor_left();
      }
   }
   this.keydown=function(key, result) {        //Respuesta al evento keydown()
      if ($w_par.length==0) return;    //No hay padre, estamos en el operando raiz.
      if ($w_par.hasClass('opdr')) {   //Este operando se encuentra dentro de un operador.
         var opdr = $w_par.get(0).obj;    //Objeto operador
         return opdr.keydown(key, result);  //Pasa el evento
      } else if ($w_par.hasClass('opdo')) { //En operando compuesto
         if (key==37) {          //Direccional izquierda
            if (this.cursor_left()) {   //Cursor al inicio
               if (o_prev!=null) {  //Hay elemento anterior
                  o_prev.recv_cursor_right();
                  return true;  //Se procesó el evento.
               } else {  //No hay elemento anterior 
                  //Pero podría ser que estemos dentro del campo de un operador.
                  $w_par = $w_par.parent().closest('.wrap');    //Accede al wrap padre. Se usa parent() porque closest() busca desde el mismo nivel.
                  if ($w_par.hasClass('opdr')) {
                     //Efectivamente estamos dentro de un operador
                     var opdr = $w_par.get(0).obj;    //Objeto operador
                     return opdr.keydown(key, result);  //Pasa el evento
                  }
               }
            }
         } else if (key==39) {   //Direccional derecha
            if (this.cursor_right()) {  //Cursor al final (pos.anterior)
               if (o_next!=null) { //Hay elemento posterior
                  o_next.recv_cursor_left();
                  return true;  //Se procesó el evento.
               } else {  //No hay elemento anterior 
                  //Pero podría ser que estemos dentro del campo de un operador.
                  $w_par = $w_par.parent().closest('.wrap');    //Accede al wrap padre. Se usa parent() porque closest() busca desde el mismo nivel.
                  if ($w_par.hasClass('opdr')) {
                     //Efectivamente estamos dentro de un operador
                     var opdr = $w_par.get(0).obj;    //Objeto operador
                     return opdr.keydown(key, result);  //Pasa el evento
                  }
               }
            }
         } else if (key==46) {   //Delete
            if (w_txt=='') {  //Texto anterior es nulo
               result.delete = true;  //Señal para que se elimine
               result.$wrap_del = this.$w; //Se debe borrar a este operando.
               return true;
            }
         }
      }
      return false;     //No procesó el evento
   }
   this.focused=function() {
      /* Indica si este operando (o alguno de sus wrap interiores) tiene el 
      enfoque. Debe estar actualizado: $w_cur. */
      if (this.isSimple()) {
         return $w_cur.is(this.$w);
      } else {  //Es operando compuesto
         return $w_cur.parents('.wrap').is(this.$w);
      }
   }
   //Métodos para obtener información del operador
   this.isSimple = function() {
      /* Indica si es operando simple, es decir que no es compuesto. */
      return (this.$w.children().length == 1);  //Debería ser suficiente.
   }
   this.lastFontSize=function() {
      /* Devuelve el tamaño de letra del "field" del último operando (si es 
      operando compuesto) o del único operando (si es operando simple) */
      if (this.isSimple() ) {
         var $field = this.$w.find('.field'); //Solo hay un campo editable
         return $field.css('font-size');
      } else {  //Es operando compuesto
         var $last = this.$w.children().last();
         return $last.css('font-size');
      }
   }
   /* Inserta el operando dentro del wrap $root_opdo. */
   if ($root_opdo==null) return null;
   if (after) {  //Se crea después de $root_opdo
      var $wrp = insert_opdo_after($root_opdo);
   } else {    //Se crea dentro de $root_opdo
      var $wrp = insert_opdo($root_opdo, wr_style);
   }
   if ($wrp==null) return;  //Algo salió mal.
   if (sel_opdo) selectWrap($wrp, 0);  //Selecciona
   //Guarda las referencias
   this.$w = $wrp;  //Al wrap
   $wrp.get(0).obj = this;   //Fija referencia a este objeto en el mismo elemento DOM, creando el campo "obj".
}
 ///////////// Objetos que representan a operadores /////////////
function o_pow(init_val='', sub=false) {  //Operador "potencia"
   /* Crea un operador de potencia o de subíndice (si es que el parámetro "sub"
    se pone a TRUE). */
   this.$w   = null;  //Referencia al wrap que representa al objeto
   this.op1  = null;  //Referencia al Operando1 de este operador
   this.$op1 = null;  //Referencia al wrap Operando1 de este operador
   this.$fra = null;  //Frame de soporte
   this.$fill = null;  //Referencia al bloque de relleno inferior.
   this.recv_cursor_right = function() { //Recibe el cursor por la derecha
      this.op1.recv_cursor_right();
   }
   this.recv_cursor_left = function() {  //Recibe el cursor por la izquierda
      this.op1.recv_cursor_left();
   }
   this.cursor_right = function() {    //Cursor al final
      /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
      "cur_beg". Como solo hay un campo editable solo basta con ver "cur_beg". */
      return this.op1.cursor_right();
   }
   this.cursor_left = function() {     //Cursor al inicio
   /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
   "cur_end". Como solo hay un campo editable solo basta con ver "cur_end". */
      return this.op1.cursor_left();
   }
   this.keydown=function(key, result) {        //Respuesta al evento keydown()
      /* Actualiza las variables de estado necesarias, de modo que reflejen
      al operador como centro del evento y no uno de sus campos. */
      var $next = this.$w.next();
      var $prev = this.$w.prev();  //Anterior al operador
      if (key==37) {          //Direccional izquierda
         if (this.cursor_left() && $prev.length>0) {  //Cursor al inicio y hay elemento anterior
            $prev.get(0).obj.recv_cursor_right();
            return true;  //Se procesó el evento.
         }
      } else if (key==39) {   //Direccional derecha
         if (this.cursor_right() && $next.length>0) { //Cursor al final (pos.anterior) y hay elemento posterior
            $next.get(0).obj.recv_cursor_left();
            return true;  //Se procesó el evento.
         }
      } else if (key==46) {   //Delete
         if (w_txt=='') {  //Texto anterior es nulo
            result.delete = true;  //Señal para que se elimine
            result.$wrap_del = this.$w; //Se debe borrar a este operador.
            return true;
         }
      }
      return false;     //No procesó el evento
   }
   this.resize=function() {  //Configura su tamaño 
      /* El tamaño de la caja del operando, se determinará de acuerdo a su 
      contenido y a su entorno. */
      //Lee elementos del entorno.
      $w_cur = this.$w;
      $w_prev = $w_cur.prev();
      o_prev  = $w_prev.length>0?$w_prev.get(0).obj:null;
      //Tamaño del operando anterior, al que se supone que se aplica este exponente.
      if (o_prev==null) {  //No hay wrap anterior.
         var prevfontsize = this.$w.css('font-size');  //Tomamos nuestra medida
      } else if ($w_prev.hasClass('opdo')) {  //Es lo que esperamos
         var prevfontsize = o_prev.lastFontSize();  //En pixels
      } else {
         //Probablemente hay un operador antes.
         $w_prev = $w_prev.prev();  //Busca al otro anterior
         o_prev  = $w_prev.length>0?$w_prev.get(0).obj:null;
         if (o_prev==null) {  //No hay wrap anterior.
            var prevfontsize = this.$w.css('font-size');  //Tomamos nuestra medida
         } else if ($w_prev.hasClass('opdo')) {  //Encontramos un operando antes
            var prevfontsize = o_prev.lastFontSize();  //En pixels
         } else {  //Hay otra cosa
            var prevfontsize = this.$w.css('font-size');  //Tomamos nuestra medida
         }
      }
      //Fija tamaño del texto para el exponente o subíndice.
      var fontsize = parseFloat(prevfontsize)*0.7;
      setFontSize(this.$w, fontsize);  //Se fija el tamaño en el wrap para que todo el contenido nuevo, herede ese tamaño.
      this.$fill.css("height", fontsize);   //Tamaño del relleno. Se pone del mismo tamaño para balancear.
   }
   //Agrega este operador en la posición actual.
   var h_opdr='<div class="wrap opdr pow">'+
   '<div class="frame">'+
   '</div></div>';
   if (!update_state()) return;  //Lee wraps.
   var $wrp = add_opdr(h_opdr, $w_par, $w_cur, cur_beg, cur_end, w_pos);
   if ($wrp==null) return;  //Algo salió mal. No se terminó de crear el objeto.
   this.$fra = $wrp.find('.frame');  //Actualiza referencia al frame
   if (sub) {  //Subíndice
      //Crea bloque para llenar el espacio superior
      var sty = "display:block;height:1rem";
      this.$fra.append('<div class="wrap" style="'+sty+'">'+ '</div>');
      this.$fill = this.$fra.children().last();  //Toma referencia.
      //Crea único operando
      this.op1 = new o_opdo(this.$fra, true, "position: relative; ");
      this.$op1 = this.op1.$w;
   } else {    //Exponente
      //Crea único operando
      this.op1 = new o_opdo(this.$fra, true, "position: relative; ");
      this.$op1 = this.op1.$w;
      //Crea bloque para llenar el espacio inferior
      var sty = "display:block;height:1rem";
      this.$fra.append('<div class="wrap" style="'+sty+'">'+ '</div>');
      this.$fill = this.$fra.children().last();  //Toma referencia.
   }
   if (init_val!='') {setTextWrap(this.$op1, init_val);}
   //Guarda las referencias
   this.$w = $wrp;  //Al wrap
   $wrp.get(0).obj = this;   //Fija referencia a este objeto en el mismo elemento DOM, creando el campo "obj".
   var $par = $wrp.parent(); //Se necesita al operando contenedor para validar.
   this.resize();
}
function o_frac(init_val='') {  //Operador "fracción"
   this.$w  = null;  //Referencia al wrap que representa al objeto
   this.op1 = null;  //Referencia al Operando1 de este operador (numerador)
   this.op2 = null;  //Referencia al Operando2 de este operador (denominador)
   this.$op1 = null; //Referencia al wrap Operando1 de este operador
   this.$op2 = null; //Referencia al wrap Operando2 de este operador
   this.$fra = null;  //Frame de soporte
   this.recv_cursor_right = function() { //Recibe el cursor por la derecha
      this.op2.recv_cursor_right();
   }
   this.recv_cursor_left = function() {  //Recibe el cursor por la izquierda
      this.op1.recv_cursor_left();
   }
   this.cursor_right = function() {    //Cursor al final
      /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
      "cur_beg". Como solo hay un campo editable solo basta con ver "cur_beg". */
      return this.op2.cursor_right();
   }
   this.cursor_left = function() {     //Cursor al inicio
      /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
      "cur_end". Como solo hay un campo editable solo basta con ver "cur_end". */
      return this.op1.cursor_left();
   }
   this.keydown=function(key, result) {        //Respuesta al evento keydown()
      /* Variables de estado que reflejen al operador como centro del evento 
      y no uno de sus campos. */
      var $next = this.$w.next();
      var $prev = this.$w.prev();  //Anterior al operador
      var $w_focused=$(":focus").closest('.wrap'); //Wrap-operando con enfoque.
      if (key==37) {          //Direccional izquierda
         if (!cur_beg) return false;  //No se procesa
         if (this.op1.cursor_left() && $prev.length>0) {  //Cursor al inicio y hay elemento anterior
            $prev.get(0).obj.recv_cursor_right();
            return true;  //Se procesó el evento.
         } else if (this.op2.cursor_left()) {
            this.op1.recv_cursor_right();
            return true;  //Se procesó el evento.
         }
      } else if (key==39) {   //Direccional derecha
         if (!cur_end) return false;  //No se procesa
         if (this.op2.cursor_right() && $next.length>0) { //Cursor al final (pos.anterior) y hay elemento posterior
            $next.get(0).obj.recv_cursor_left();
            return true;  //Se procesó el evento.
         } else if (this.op1.cursor_right()) {
            this.op2.recv_cursor_left();
            return true;  //Se procesó el evento.
         }
      } else if (key==46) {  //Delete
         if (w_txt!='') return false;  //No se procesa porque hay texto aún.
         //Texto anterior es nulo.
         /* Basta con comparar en un solo nivel de this.$op1, porque se supone
         que debe estar vacío, es decir que sea un operando simple. */
         if ($w_focused.is(this.$op1) && getTextWrap(this.$op2)=='') {  
            result.delete = true;  //Señal para que se elimine
            result.$wrap_del = this.$w; //Se debe borrar a este operador.
            return true;
         } else if ($w_focused.is(this.$op2) && getTextWrap(this.$op1)=='') {  
            result.delete = true;  //Señal para que se elimine
            result.$wrap_del = this.$w; //Se debe borrar a este operador.
            return true;
         }
      } else if (key==38) {  //Direccional arriba
         return true;
      } else if (key==40) {  //Direccinal abajo
         return true;
      }
      return false;     //No porcesó el evento
   }
   this.resize=function() {  //Configura su tamaño 

   }
   //Calcula altura del contenedor y tamaño de exponente.
   var hf=1.8;
   var fsiz=0.8;
   //Agrega este operador en la posición actual.
   var h_opdr='<div class="wrap opdr pow" >'+`<div class="frame" id=exp >`+
 '</div></div>';
   if (!update_state()) return;  //Lee wraps.
   var $wrp = add_opdr(h_opdr, $w_par, $w_cur, cur_beg, cur_end, w_pos);
   if ($wrp==null) return;  //Algo salió mal. No se terminar de crear el objeto.
   this.$fra = $wrp.find('.frame');  //Actualiza referencia al frame
   //Crea operandos
   this.op1 = new o_opdo(this.$fra, true, "display:block; border-bottom:1px solid black; text-align:center;");
   this.$op1 = this.op1.$w;
   this.op2 = new o_opdo(this.$fra, false,"display:block; border-top:1px solid black; text-align:center;");
   this.$op2 = this.op2.$w;

   if (init_val!='') {setTextWrap(this.$op1, init_val);}

    //Guarda las referencias
    this.$w = $wrp;  //Al wrap
    $wrp.get(0).obj = this;   //Fija referencia a este objeto en el mismo elemento DOM, creando el campo "obj".
    var $par = $wrp.parent(); //Se necesita al operando contenedor para validar.
    this.resize();
    //validate_wraps($par);
}
function o_sqrt(init_val='') {  //Operador "raiz"
   this.$w  = null;  //Referencia al wrap que representa al objeto
   this.op1 = null;  //Referencia al Operando1 de este operador (raiz)
   this.op2 = null;  //Referencia al Operando2 de este operador (argumento)
   this.$op1 = null; //Referencia al wrap Operando1 de este operador
   this.$op2 = null; //Referencia al wrap Operando2 de este operador
   this.$fra = null;  //Frame de soporte
   this.recv_cursor_right = function() { //Recibe el cursor por la derecha
      this.op2.recv_cursor_right();
   }
   this.recv_cursor_left = function() {  //Recibe el cursor por la izquierda
      this.op1.recv_cursor_left();
   }
   this.cursor_right = function() {    //Cursor al final
      /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
      "cur_beg". Como solo hay un campo editable solo basta con ver "cur_beg". */
      return this.op2.cursor_right();
   }
   this.cursor_left = function() {     //Cursor al inicio
      /* Este método solo funcionará si $w tiene el enfoque y se ha actualizado
      "cur_end". Como solo hay un campo editable solo basta con ver "cur_end". */
      return this.op1.cursor_left();
   }
   this.keydown=function(key, result) {        //Respuesta al evento keydown()
      /* Variables de estado que reflejen al operador como centro del evento 
      y no uno de sus campos. */
      var $next = this.$w.next();
      var $prev = this.$w.prev();  //Anterior al operador
      var $w_focused=$(":focus").closest('.wrap'); //Wrap-operando con enfoque.
      if (key==37) {          //Direccional izquierda
         if (!cur_beg) return false;  //No se procesa
         if (this.op1.cursor_left() && $prev.length>0) {  //Cursor al inicio y hay elemento anterior
            $prev.get(0).obj.recv_cursor_right();
            return true;  //Se procesó el evento.
         } else if (this.op2.cursor_left()) {
            this.op1.recv_cursor_right();
            return true;  //Se procesó el evento.
         }
      } else if (key==39) {   //Direccional derecha
         if (!cur_end) return false;  //No se procesa
         if (this.op2.cursor_right() && $next.length>0) { //Cursor al final (pos.anterior) y hay elemento posterior
            $next.get(0).obj.recv_cursor_left();
            return true;  //Se procesó el evento.
         } else if (this.op1.cursor_right()) {
            this.op2.recv_cursor_left();
            return true;  //Se procesó el evento.
         }
      } else if (key==46) {  //Delete
         if (w_txt!='') return false;  //No se procesa porque hay texto aún.
         //Texto anterior es nulo.
         /* Basta con comparar en un solo nivel de this.$op1, porque se supone
         que debe estar vacío, es decir que sea un operando simple. */
         if ($w_focused.is(this.$op1) && getTextWrap(this.$op2)=='') {  
            result.delete = true;  //Señal para que se elimine
            result.$wrap_del = this.$w; //Se debe borrar a este operador.
            return true;
         } else if ($w_focused.is(this.$op2) && getTextWrap(this.$op1)=='') {  
            result.delete = true;  //Señal para que se elimine
            result.$wrap_del = this.$w; //Se debe borrar a este operador.
            return true;
         }
      } else if (key==38) {  //Direccional arriba
         return true;
      } else if (key==40) {  //Direccinal abajo
         return true;
      }
      return false;     //No porcesó el evento
   }
   this.resize=function() {  //Configura su tamaño 
      //Calcula el nuevo tamaño para el exponente o subíndice.
      var prevfontsize = this.$w.css('font-size');  //Por ahora tomamos la medida del wrap
      var fontsize = parseFloat(prevfontsize)*0.8;  //Tamaño para el radical
      //Configura tamaño de radical
      setFontSize(this.$op1, fontsize); 
      this.$fra.css("height: ", prevfontsize);   //Tamaño del frame.
      this.$op1.css("top", -fontsize*0.5);   //Por encima del top del frame
      this.$op1.css("left", "3px");   //Por encima del top del frame
   }
   //Calcula altura del contenedor y tamaño de exponente.
   var hf=1.8;
   var fsiz=0.8;
   //Agrega este operador en la posición actual.
   var h_opdr='<div class="wrap opdr pow" >'+`<div class="frame" id=exp >`+
 '</div></div>';
   if (!update_state()) return;  //Lee wraps.
   var $wrp = add_opdr(h_opdr, $w_par, $w_cur, cur_beg, cur_end, w_pos);
   if ($wrp==null) return;  //Algo salió mal. No se terminar de crear el objeto.
   this.$fra = $wrp.find('.frame');
   //Crea operando radical
   this.op1 = new o_opdo(this.$fra, true, "position: relative; ");
   this.$op1 = this.op1.$w;
   //Bloque para dibujar el símbolo de raiz.
   var sty = "width:6px; position: relative; background: "+  //Diagonal larga "/"
   "linear-gradient(to top left,rgba(0,0,0,0) 0%,rgba(0,0,0,0) calc(50% - 0.8px),"+
   "rgba(0,0,0,1) 50%,rgba(0,0,0,0) calc(50% + 0.8px),rgba(0,0,0,0) 100%)";
   var sty1 = "width:5px; height:7px; position:absolute;"+  //Diagonal corta "\"
   "bottom:0px;left:-5px;" + 
   "background: linear-gradient(to top right,rgba(0,0,0,0) 0%,rgba(0,0,0,0) calc(50% - 0.8px),"+
   "rgba(0,0,0,1) 50%,rgba(0,0,0,0) calc(50% + 0.8px),rgba(0,0,0,0) 60%);"; 
   this.$fra.append('<div class="wrap" style="'+sty+'">'+
   '<div style="'+sty1+'"></div>'+ '</div>');

   var $wrp_root = this.$fra.children().last();
   //Crea operando 
   this.op2 = new o_opdo(this.$fra, false,"border-top:1px solid black; ");
   this.$op2 = this.op2.$w;

   if (init_val!='') {setTextWrap(this.$op1, init_val);}

    //Guarda las referencias
    this.$w = $wrp;  //Al wrap
    $wrp.get(0).obj = this;   //Fija referencia a este objeto en el mismo elemento DOM, creando el campo "obj".
    var $par = $wrp.parent(); //Se necesita al operando contenedor para validar.
    this.resize();
    //validate_wraps($par);
}
