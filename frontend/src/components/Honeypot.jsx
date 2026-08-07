/**
 * Champ piège anti-robot.
 *
 * Invisible et inatteignable pour un humain — retiré du flux, du parcours de
 * tabulation et des lecteurs d'écran — mais présent dans le DOM, donc rempli
 * par les robots qui soumettent aveuglément tous les champs d'un formulaire.
 *
 * Le backend (`HoneypotMixin.est_robot`) répond alors comme si tout allait bien
 * plutôt que de renvoyer une erreur, pour ne pas révéler au robot ce qui l'a
 * trahi.
 *
 * `display: none` est délibérément évité : certains robots ignorent les champs
 * masqués ainsi. Le champ est donc positionné hors écran.
 *
 * Nommé « website » plutôt que « honeypot » : le nom d'un champ est le premier
 * indice qu'un robot un peu sérieux inspecte.
 */
export function Honeypot({ value, onChange }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: 1,
        height: 1,
        overflow: 'hidden',
      }}
    >
      <label htmlFor="website">Ne remplissez pas ce champ</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
