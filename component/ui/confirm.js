import { Modal } from "react-bootstrap"
import classNames from "classnames"

export const ConfirmDelete=({show, toggle, title, sub_title, deleteAction})=>{
    return (
        <Modal show={show} backdrop="static" onHide={toggle} className="modal-blur" size="sm" backdropClassName="backdrop-nested">
            <button type="button" class="btn-close" onClick={toggle}></button>

            <div class="modal-body text-center py-4 rounded-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon mb-2 text-danger icon-lg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v2m0 4v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
                <h3>{title}</h3>
                <div class="text-muted">{sub_title}</div>
            </div>
            <div class="modal-footer">
                <div class="w-100">
                <div class="row">
                    <div class="col">
                        <button type="button" class="btn w-100" onClick={toggle}>
                            Batal
                        </button>
                    </div>
                    <div class="col">
                        <button type="button" class="btn btn-danger w-100" onClick={deleteAction}>
                            Ya, Hapus Data
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </Modal>
    )
}

export const Confirm=({show, toggle, title, sub_title, action, action_text="", btn_type="btn-danger"})=>{
    return (
        <Modal show={show} backdrop="static" onHide={toggle} dialogClassName="modal-smd">
            <Modal.Body className="pb-0">
                <h4 class="fs-5 fw-bold">{title}</h4>
                <p className="mb-0">{sub_title}</p>
            </Modal.Body>
            <Modal.Footer className="mt-2">
                <button type="button" class="btn btn-link link-dark me-auto" onClick={toggle}>Cancel</button>
                <button type="button" class={classNames("btn", btn_type)} onClick={action}>{action_text}</button>
            </Modal.Footer>
        </Modal>
    )
}