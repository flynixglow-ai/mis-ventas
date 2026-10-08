import { useState } from 'react'
import { crearCliente, editarCliente } from '../datos/repositorios/clientes'
import type { Cliente } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { Campo, ErrorGeneral, claseArea, claseEntrada, mensajeDe } from '../ui/Campo'
import { Hoja } from '../ui/Hoja'
import { useEnvio } from '../ui/useEnvio'

interface Props {
  cliente?: Cliente
  nombreInicial?: string
  alCerrar: () => void
  /** Se llama con el cliente recién creado (para seleccionarlo en un pedido). */
  alCrear?: (cliente: Cliente) => void
}

export function FormularioCliente({ cliente, nombreInicial = '', alCerrar, alCrear }: Props) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? nombreInicial)
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')
  const { errores, enviando, enviar } = useEnvio()

  async function guardar() {
    const datos = { nombre, telefono, notas }
    if (cliente) return editarCliente(cliente.id, datos)
    const creado = await crearCliente(datos)
    alCrear?.(creado)
  }

  return (
    <Hoja titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} alCerrar={alCerrar}>
      <form className="space-y-4" onSubmit={async (e) => (await enviar(guardar, e)) && alCerrar()}>
        <ErrorGeneral errores={errores} />
        <Campo etiqueta="Nombre" error={mensajeDe(errores, 'nombre')}>
          <input
            className={claseEntrada}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. María López"
            autoFocus={!cliente}
            autoComplete="off"
            autoCapitalize="words"
          />
        </Campo>
        <Campo etiqueta="Teléfono" opcional>
          <input
            type="tel"
            inputMode="tel"
            className={claseEntrada}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 300 123 4567"
            autoComplete="off"
          />
        </Campo>
        <Campo etiqueta="Notas" opcional>
          <textarea className={claseArea} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Campo>
        <Boton type="submit" disabled={enviando}>
          Guardar
        </Boton>
      </form>
    </Hoja>
  )
}
