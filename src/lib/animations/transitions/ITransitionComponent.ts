export interface ITransitionComponent {
    enter: () => Promise<void>,
    leave: () => Promise<void>
}